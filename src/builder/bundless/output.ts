import { MagicString, remapping, winPath } from '@umijs/utils';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { IFatherBundlessTypes } from '../../types';
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

// Resolve package scopes that will be copied, even before the assets are emitted.
// Reading mapped source metadata also keeps relocated overrides consistent.
function getPackageType(
  file: string,
  cwd: string,
  provider: BundlessConfigProvider,
) {
  let dir = path.dirname(file);
  while (dir !== cwd && dir !== path.dirname(dir)) {
    for (const config of provider.configs) {
      const relative = path.relative(path.join(cwd, config.output), dir);
      if (
        relative === '..' ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
      )
        continue;
      const source = path.resolve(cwd, config.input, relative, 'package.json');
      if (
        isFile(source) &&
        provider.getConfigForFile(winPath(path.relative(cwd, source))) ===
          config
      ) {
        return JSON.parse(fs.readFileSync(source, 'utf-8')).type;
      }
    }
    const packageFile = path.join(dir, 'package.json');
    if (isFile(packageFile))
      return JSON.parse(fs.readFileSync(packageFile, 'utf-8')).type;
    dir = path.dirname(dir);
  }
  return provider.pkg.type;
}

export function getOutputFile(
  sourceFile: string,
  cwd: string,
  provider: BundlessConfigProvider,
) {
  const config = provider.getConfigForFile(
    winPath(path.relative(cwd, sourceFile)),
  )!;
  const file = path.join(
    cwd,
    config.output,
    path.relative(config.input, path.relative(cwd, sourceFile)),
  );
  if (!config.autoExtension) return file;
  const modulePackage = getPackageType(file, cwd, provider) === 'module';
  const extension =
    config.format === IFatherBundlessTypes.ESM
      ? modulePackage
        ? '.js'
        : '.mjs'
      : modulePackage
      ? '.cjs'
      : '.js';
  // Explicit .mjs/.cjs and .d.mts/.d.cts assets retain their module identity.
  return file
    .replace(
      /\.d\.ts(?=\.map$|$)/,
      `.d.${extension.slice(1).replace('js', 'ts')}`,
    )
    .replace(/(?<!\.d)\.(tsx?|jsx?)(?=\.map$|$)/, extension);
}

export function getDeclarationFile(file: string, runtimeFile: string) {
  const extension = path.extname(runtimeFile).slice(1).replace('js', 'ts');
  return file.replace(/\.d\.ts(?=\.map$|$)/, `.d.${extension}`);
}

function redirects(config: IBundlessConfig, declaration: boolean) {
  return (
    config.redirect?.[declaration ? 'dts' : 'js']?.extension ??
    config.autoExtension ??
    false
  );
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
    (/\.[cm]?js$/.test(request)
      ? findFile(
          sourceRequest.slice(0, -path.extname(sourceRequest).length),
          sourceExtensions,
        )
      : undefined);
  let target: string | undefined;
  if (source) {
    const config = provider.getConfigForFile(
      winPath(path.relative(cwd, source)),
    );
    if (config) {
      const emitted = getOutputFile(source, cwd, provider);
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
    `Cannot resolve module reference ${JSON.stringify(
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
  // Load the parser only when module reference rewriting is enabled.
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
      ? redirects(config, source.isDeclarationFile)
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
      config.format === IFatherBundlessTypes.CJS &&
      ts.isCallExpression(node) &&
      ((ts.isIdentifier(node.expression) &&
        node.expression.text === 'require') ||
        (ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'require' &&
          node.expression.name.text === 'resolve'))
    ) {
      replace(node.arguments[0]);
    } else if (ts.isExternalModuleReference(node) && source.isDeclarationFile) {
      replace(node.expression);
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

export function finalizeOutputs(
  outputs: IOutputFile[],
  cwd: string,
  provider: BundlessConfigProvider,
) {
  if (
    !provider.configs.some(
      (config) =>
        config.autoExtension ||
        redirects(config, false) ||
        redirects(config, true) ||
        config.resolveDepSubpath,
    )
  )
    return;
  const enabledOutputs = outputs.map((output) => ({
    ...output,
    config: provider.getConfigForFile(
      winPath(path.relative(cwd, output.sourceFile)),
    ),
  }));
  // Generated declarations are relocated after tsc emits them. Copied maps
  // already describe their own sources and must retain those mappings.
  for (const output of enabledOutputs) {
    if (
      !output.config ||
      !isFile(output.file) ||
      !/\.d\.[cm]?ts\.map$/.test(output.file)
    )
      continue;
    if (
      !redirects(output.config, true) &&
      !output.config.autoExtension &&
      !output.config.resolveDepSubpath
    )
      continue;
    const map = JSON.parse(fs.readFileSync(output.file, 'utf-8'));
    if (!/\.d\.[cm]?ts(?:\.map)?$/.test(output.sourceFile) && !map.sourceRoot) {
      map.sources = [
        winPath(path.relative(path.dirname(output.file), output.sourceFile)),
      ];
    }
    if (output.config.autoExtension)
      map.file = path.basename(output.file.slice(0, -4));
    fs.writeFileSync(output.file, JSON.stringify(map));
  }
  for (const output of enabledOutputs) {
    const config = output.config;
    if (
      !config ||
      !/(?:\.[cm]?js|\.d\.[cm]?ts)$/.test(output.file) ||
      !isFile(output.file)
    )
      continue;
    if (config.autoExtension) {
      const mapFile = `${output.file}.map`;
      if (isFile(mapFile)) {
        const map = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
        map.file = path.basename(output.file);
        fs.writeFileSync(mapFile, JSON.stringify(map));
        const content = fs.readFileSync(output.file, 'utf-8');
        fs.writeFileSync(
          output.file,
          content.replace(
            /^([ \t]*\/\/[#@] sourceMappingURL=)[^\r\n]+$/gm,
            `$1${path.basename(mapFile)}`,
          ),
        );
      }
    }
    if (
      redirects(config, /\.d\.[cm]?ts$/.test(output.file)) ||
      config.resolveDepSubpath
    ) {
      rewriteOutput(output, cwd, provider, config);
    }
  }
}
