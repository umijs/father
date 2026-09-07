import { MagicString, remapping, winPath } from '@umijs/utils';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import type { BundlessConfigProvider, IBundlessConfig } from '../config';

function isFile(file: string) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

export function getRuntimePath(file: string) {
  return file
    .replace(/\.d\.mts$/, '.mjs')
    .replace(/\.d\.cts$/, '.cjs')
    .replace(/\.d\.ts$/, '.js')
    .replace(/\.(tsx?|jsx)$/, '.js');
}

const runtimeExtensions = ['.js', '.mjs', '.cjs'];
const declarationExtensions = ['.d.ts', '.d.mts', '.d.cts'];

function findFile(file: string, extensions: string[]) {
  return [
    file,
    ...extensions.map((ext) => `${file}${ext}`),
    ...extensions.map((ext) => path.join(file, `index${ext}`)),
  ].find(isFile);
}

function resolvePackageSpecifier(file: string, specifier: string) {
  // Package roots, imports maps, URLs and builtins already have Node semantics.
  if (/^(?:[a-zA-Z][\w+.-]*:|#|\/)/.test(specifier)) return specifier;
  const parts = specifier.split('/');
  const name = parts.slice(0, specifier.startsWith('@') ? 2 : 1).join('/');
  if (name === specifier) return specifier;

  try {
    const requireFromFile = createRequire(file);
    const packageFile = requireFromFile.resolve(`${name}/package.json`);
    const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
    // Do not use require conditions to rewrite packages with an exports map.
    if (Object.prototype.hasOwnProperty.call(pkg, 'exports')) return specifier;
    const resolved = requireFromFile.resolve(specifier);
    const relative = winPath(
      path.relative(path.dirname(packageFile), resolved),
    );
    if (
      !relative.startsWith('../') &&
      !path.isAbsolute(relative) &&
      runtimeExtensions.includes(path.extname(relative))
    ) {
      return `${name}/${relative}`;
    }
  } catch {
    // Optional dependencies and packages hiding package.json are left intact.
  }
  return specifier;
}

interface IOutputFile {
  file: string;
  sourceFile: string;
}

function resolveRelativeSpecifier(
  specifier: string,
  output: IOutputFile,
  cwd: string,
  provider: BundlessConfigProvider,
) {
  const suffixIndex = specifier.search(/[?#]/);
  const request = suffixIndex < 0 ? specifier : specifier.slice(0, suffixIndex);
  const suffix = suffixIndex < 0 ? '' : specifier.slice(suffixIndex);
  const isDeclaration = /\.d\.[cm]?ts$/.test(output.file);
  const extensions = isDeclaration
    ? [...runtimeExtensions, ...declarationExtensions]
    : runtimeExtensions;

  // Resolve against sources first so overrides with relocated outputs also work.
  const sourceRequest = path.resolve(path.dirname(output.sourceFile), request);
  const sourceExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    ...declarationExtensions,
  ];
  const source =
    findFile(sourceRequest, sourceExtensions) ||
    (/\.js$/.test(request)
      ? findFile(sourceRequest.slice(0, -3), sourceExtensions)
      : undefined);
  let target: string | undefined;
  if (source) {
    const config = provider.getConfigForFile(
      winPath(path.relative(cwd, source)),
    );
    if (config) {
      const emitted = path.resolve(
        cwd,
        config.output,
        path.relative(config.input, path.relative(cwd, source)),
      );
      const runtime = getRuntimePath(emitted);
      if (isFile(runtime) || (isDeclaration && isFile(emitted))) {
        target = runtime;
      }
    }
  }
  target ||= findFile(
    path.resolve(path.dirname(output.file), request),
    extensions,
  );
  if (target) {
    const relative = winPath(
      path.relative(path.dirname(output.file), getRuntimePath(target)),
    );
    return `${
      relative.startsWith('../') ? relative : `./${relative}`
    }${suffix}`;
  }
  if (path.extname(request)) return specifier;
  throw new Error(
    `Cannot resolve fully specified ESM import ${JSON.stringify(
      specifier,
    )} from ${path.relative(cwd, output.file)}`,
  );
}

function rewriteOutput(
  output: IOutputFile,
  cwd: string,
  provider: BundlessConfigProvider,
  config: IBundlessConfig,
) {
  // Load the parser only when ESM import rewriting is enabled.
  const ts: typeof import('typescript') = require('typescript');
  const content = fs.readFileSync(output.file, 'utf-8');
  const source = ts.createSourceFile(
    output.file,
    content,
    ts.ScriptTarget.Latest,
    true,
  );
  const result = new MagicString(content);
  let changed = false;
  const replace = (node: import('typescript').Node | undefined) => {
    if (!node || !ts.isStringLiteralLike(node)) return;
    const specifier = node.text;
    const isRelative = /^(?:\.\.?\/|\.\.?$)/.test(specifier);
    const replacement = isRelative
      ? config.fullySpecified
        ? resolveRelativeSpecifier(specifier, output, cwd, provider)
        : specifier
      : config.resolveDepSubpath
      ? resolvePackageSpecifier(output.file, specifier)
      : specifier;
    if (replacement !== specifier) {
      result.overwrite(
        node.getStart(source),
        node.end,
        JSON.stringify(replacement),
      );
      changed = true;
    }
  };
  const visit = (node: import('typescript').Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      replace(node.moduleSpecifier);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      replace(node.arguments[0]);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument)
    ) {
      replace(node.argument.literal);
    } else if (source.isDeclarationFile && ts.isModuleDeclaration(node)) {
      // Relative module augmentations must refer to the same fully specified module.
      if (ts.isStringLiteral(node.name) && node.name.text.startsWith('.'))
        replace(node.name);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!changed) return;

  // Compose the edits with JS/declaration maps instead of invalidating columns.
  const mapFile = `${output.file}.map`;
  if (isFile(mapFile)) {
    const originalMap = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
    const editMap = result.generateMap({
      hires: true,
      source: path.basename(output.file),
    });
    const map = remapping([editMap, originalMap], () => null);
    map.file = originalMap.file;
    fs.writeFileSync(mapFile, JSON.stringify(map));
  }
  fs.writeFileSync(output.file, result.toString());
}

export function finalizeEsm(
  outputs: IOutputFile[],
  cwd: string,
  provider: BundlessConfigProvider,
) {
  if (
    !provider.configs.some(
      (config) =>
        config.fullySpecified ||
        config.resolveDepSubpath ||
        config.outputPackageType,
    )
  )
    return;
  const enabledOutputs = outputs.map((output) => ({
    ...output,
    config: provider.getConfigForFile(
      winPath(path.relative(cwd, output.sourceFile)),
    ),
  }));
  // tsc emits maps relative to its declaration location; Father relocates
  // declarations to the configured output (possibly an override directory).
  for (const output of enabledOutputs) {
    if (
      output.config?.fullySpecified &&
      /\.d\.[cm]?ts\.map$/.test(output.file) &&
      isFile(output.file)
    ) {
      const map = JSON.parse(fs.readFileSync(output.file, 'utf-8'));
      if (!map.sourceRoot) {
        map.sources = [
          winPath(path.relative(path.dirname(output.file), output.sourceFile)),
        ];
        fs.writeFileSync(output.file, JSON.stringify(map));
      }
    }
  }
  for (const output of enabledOutputs) {
    const config = output.config;
    if (
      (config?.fullySpecified || config?.resolveDepSubpath) &&
      /(?:\.m?js|\.d\.[cm]?ts)$/.test(output.file) &&
      isFile(output.file)
    ) {
      rewriteOutput(output, cwd, provider, config);
    }
  }
  // A package marker is independent of import rewriting. Include relocated
  // overrides and copied package scopes while preserving their other metadata.
  const packageFiles = new Set(
    provider.configs
      .filter((config) => config.outputPackageType === 'module')
      .map((config) => path.resolve(cwd, config.output, 'package.json')),
  );
  enabledOutputs
    .filter(
      (output) =>
        output.config?.outputPackageType === 'module' &&
        path.basename(output.file) === 'package.json',
    )
    .forEach((output) => packageFiles.add(output.file));
  for (const file of packageFiles) {
    const pkg = isFile(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {};
    if (pkg.type !== 'module') {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(
        file,
        `${JSON.stringify({ ...pkg, type: 'module' }, null, 2)}\n`,
      );
    }
  }
}
