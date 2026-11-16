import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import vm from 'vm';

const rootPath = path.resolve(__dirname, '..');
const fixtures: string[] = [];
const libraryName = 'ExternalsRuntimeFixture';
const externalName = 'HostDependency';

type LoadMode = 'commonjs' | 'umd-loader' | 'browser';
interface HostDependency {
  state: { value: number };
}
interface Library {
  dependency: HostDependency;
  namedState: HostDependency['state'];
  increment(): number;
}

function build(bundler: 'webpack' | 'utoopack') {
  // Keep the fixture inside rootPath so Pack can read its source and loaders.
  const cwd = fs.mkdtempSync(path.join(__dirname, '.tmp-umd-externals-'));
  fixtures.push(cwd);
  fs.mkdirSync(path.join(cwd, 'src'));
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify({ name: 'externals-runtime-fixture', version: '1.0.0' }),
  );
  fs.writeFileSync(
    path.join(cwd, 'src/index.js'),
    `import dependency, { state } from 'host-dep';
export { dependency };
export const namedState = state;
export function increment() {
  dependency.state.value += 1;
  return dependency.state.value;
}
`,
  );
  fs.writeFileSync(
    path.join(cwd, '.fatherrc.js'),
    `export default ${JSON.stringify({
      umd: {
        entry: 'src/index.js',
        name: libraryName,
        bundler,
        rootPath,
        output: { path: 'dist', filename: 'externals.min.js' },
        externals: { 'host-dep': externalName },
      },
    })};`,
  );

  // Run the real CLI/service/build pipeline in a child process, loading source
  // with tsx so this regression never accidentally tests a stale dist build.
  // No bundler mocks or parent-process environment changes are involved.
  let output: string;
  try {
    output = execFileSync(
      process.execPath,
      [
        '--require',
        require.resolve('tsx/cjs'),
        '-e',
        `require(${JSON.stringify(
          path.join(rootPath, 'src/cli/cli.ts'),
        )}).run({ args: { _: ['build'], $0: 'node' } }).catch(error => {
          console.error(error);
          process.exitCode = 1;
        });`,
      ],
      {
        cwd,
        env: {
          ...process.env,
          APP_ROOT: cwd,
          FATHER_CACHE: 'none',
          NODE_ENV: 'production',
          TURBO_TASKS_AVAILABLE_PARALLELISM: '2',
        },
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
  } catch (error: any) {
    throw new Error(
      `${bundler} CLI build failed:\n${error.stdout || ''}\n${
        error.stderr || error.message
      }`,
    );
  }

  const outputFile = path.join(cwd, 'dist/externals.min.js');
  if (!fs.existsSync(outputFile)) {
    throw new Error(`${bundler} did not emit its UMD bundle:\n${output}`);
  }
  return fs.readFileSync(outputFile, 'utf-8');
}

function load(code: string, mode: LoadMode, host: HostDependency) {
  const required: string[] = [];
  const inject = (name: string) => {
    required.push(name);
    if (name !== externalName) {
      throw new Error(`Unexpected external request: ${name}`);
    }
    return host;
  };
  const sandbox: Record<string, any> = { URL };
  sandbox.self = sandbox;
  const context = vm.createContext(sandbox);
  let library: Library;

  if (mode === 'browser') {
    // No module/exports/require: the UMD must use the host's browser global.
    sandbox[externalName] = host;
    vm.runInContext(code, context, { timeout: 5000 });
    library = sandbox[libraryName];
  } else {
    // A CommonJS host injects require without defining HostDependency globally.
    const module = { exports: {} };
    expect(externalName in sandbox).toBe(false);
    if (mode === 'commonjs') {
      Object.assign(sandbox, {
        module,
        exports: module.exports,
        require: inject,
      });
      vm.runInContext(code, context, { timeout: 5000 });
    } else {
      // @alipay/umd-loader evaluates UMD with module/exports/require function
      // arguments. Exercise that branch without adding a dependency global.
      const evaluate = vm.runInContext(
        `(function(module, exports, require) {\n${code}\n})`,
        context,
        { timeout: 5000 },
      );
      evaluate(module, module.exports, inject);
    }
    expect(externalName in sandbox).toBe(false);
    library = module.exports as Library;
  }

  return { library, required };
}

afterAll(() => {
  fixtures.forEach((cwd) => fs.rmSync(cwd, { recursive: true, force: true }));
});

// Webpack is a real-build oracle for the public father externals contract; both
// bundlers execute identical source/configuration and the same runtime checks.
describe.each(['webpack', 'utoopack'] as const)(
  '%s UMD externals runtime',
  (bundler) => {
    let code: string;
    beforeAll(() => {
      code = build(bundler);
    });

    test.each<LoadMode>(['commonjs', 'umd-loader', 'browser'])(
      'uses the supplied dependency singleton in %s',
      (mode) => {
        const host = { state: { value: 41 } };
        const { library, required } = load(code, mode, host);

        expect(Object.keys(library).sort()).toEqual([
          'dependency',
          'increment',
          'namedState',
        ]);
        expect(library.dependency).toBe(host);
        expect(library.namedState).toBe(host.state);
        expect(library.increment()).toBe(42);
        expect(host.state.value).toBe(42);
        host.state.value = 50;
        expect(library.increment()).toBe(51);

        if (mode === 'browser') expect(required).toEqual([]);
        else expect(new Set(required)).toEqual(new Set([externalName]));
      },
    );
  },
);
