import type { BundleOptions } from '@utoo/pack';
import path from 'path';
import type { IBundleConfig } from '../config';
import { getBundleTargets } from '../utils';

type UtooPackConfig = BundleOptions['config'];

export function getUtooPackCompatibility(
  config: IBundleConfig,
  { cwd, development }: { cwd: string; development: boolean },
): Partial<UtooPackConfig> {
  const compatibility: Partial<UtooPackConfig> = {};
  if (config.platform !== 'node') {
    compatibility.target = Object.entries(getBundleTargets(config))
      .map(
        ([browser, version]) =>
          `${browser === 'ios' ? 'ios_saf' : browser} ${version}`,
      )
      .join(', ');
  }

  for (const plugin of (config.extraBabelPlugins || []).filter(Boolean)) {
    const [name, options = {}] = Array.isArray(plugin) ? plugin : [plugin];
    if ((options as unknown) === false) continue;
    if (options === null) {
      throw new Error(
        `Babel plugin options for ${String(
          name,
        )} must be an object, false, or undefined.`,
      );
    }
    if (name === 'babel-plugin-transform-typescript-metadata') {
      const ts: typeof import('typescript') = require('typescript');
      // Native transforms use the nearest tsconfig/jsconfig, independent of
      // FATHER_TSCONFIG_NAME. TypeScript resolves inherited compiler flags.
      const configPath = ['tsconfig.json', 'jsconfig.json']
        .map((file) => ts.findConfigFile(cwd, ts.sys.fileExists, file))
        .filter((file): file is string => Boolean(file))
        .sort((a, b) => path.dirname(b).length - path.dirname(a).length)[0];
      const sourceFile = configPath
        ? ts.readJsonConfigFile(configPath, ts.sys.readFile)
        : undefined;
      const compilerOptions =
        configPath && sourceFile
          ? ts.parseJsonSourceFileConfigFileContent(
              sourceFile,
              ts.sys,
              path.dirname(configPath),
              undefined,
              configPath,
            ).options
          : undefined;
      const configFiles = configPath
        ? [configPath, ...(sourceFile?.extendedSourceFiles || [])]
        : [];
      if (
        configFiles.some((file) =>
          Array.isArray(
            ts.readConfigFile(file, ts.sys.readFile).config?.extends,
          ),
        )
      ) {
        throw new Error(
          'utoopack does not support array extends in the tsconfig/jsconfig inheritance chain for babel-plugin-transform-typescript-metadata. Use string extends or the webpack bundler.',
        );
      }
      if (
        !compilerOptions?.experimentalDecorators ||
        !compilerOptions.emitDecoratorMetadata
      ) {
        throw new Error(
          'utoopack requires experimentalDecorators: true and emitDecoratorMetadata: true in tsconfig.json/jsconfig.json for babel-plugin-transform-typescript-metadata. Enable these flags or use the webpack bundler.',
        );
      }
      continue;
    }
    if (name !== '@emotion' && name !== '@emotion/babel-plugin') {
      throw new Error(
        `utoopack does not support extraBabelPlugins entry ${String(
          name,
        )}. Use the webpack bundler for this Babel plugin.`,
      );
    }

    if (options.cssPropOptimization === false) {
      throw new Error(
        'utoopack does not support Emotion cssPropOptimization: false. Use the webpack bundler for this Babel plugin option.',
      );
    }
    const autoLabel = options.autoLabel || 'dev-only';
    if (!['dev-only', 'always', 'never'].includes(autoLabel)) {
      throw new Error(`Invalid Emotion autoLabel option: ${String(autoLabel)}`);
    }
    const emotionOptions = {
      ...options,
      // SWC currently does not resolve dev-only against the build mode.
      autoLabel:
        autoLabel === 'dev-only'
          ? development
            ? 'always'
            : 'never'
          : autoLabel,
    };
    compatibility.styles = {
      emotion: {
        ...(options.sourceMap === undefined
          ? {}
          : { sourcemap: options.sourceMap }),
        autoLabel: emotionOptions.autoLabel,
        ...(options.labelFormat === undefined
          ? {}
          : { labelFormat: options.labelFormat }),
        ...(options.importMap === undefined
          ? {}
          : { importMap: options.importMap }),
      },
    };
    const nativeEmotion = config.utoopack?.styles?.emotion;
    if (nativeEmotion === false) continue;
    const foreignEmotionOptions: Record<string, any> = { ...emotionOptions };
    if (typeof nativeEmotion === 'object') {
      for (const [nativeOption, babelOption] of [
        ['sourcemap', 'sourceMap'],
        ['autoLabel', 'autoLabel'],
        ['labelFormat', 'labelFormat'],
        ['importMap', 'importMap'],
      ] as const) {
        if (nativeEmotion[nativeOption] !== undefined) {
          foreignEmotionOptions[babelOption] = nativeEmotion[nativeOption];
        }
      }
    }
    // Native Emotion transforms cover project sources. Dependencies need the
    // same Babel plugin, without a second TypeScript/decorator transform.
    compatibility.module = {
      rules: Object.fromEntries(
        ['*.js', '*.jsx', '*.mjs', '*.cjs']
          .filter(
            (pattern) => !(pattern in (config.utoopack?.module?.rules || {})),
          )
          .map((pattern) => [
            pattern,
            {
              condition: 'foreign',
              loaders: [
                {
                  loader: require.resolve(
                    '@umijs/bundler-webpack/compiled/babel-loader',
                  ),
                  options: {
                    cwd,
                    babelrc: false,
                    configFile: false,
                    sourceType: 'unambiguous',
                    parserOpts: { plugins: ['jsx'] },
                    plugins: [['@emotion/babel-plugin', foreignEmotionOptions]],
                  },
                },
              ],
            },
          ]),
      ),
    };
  }
  if (config.extraBabelPresets?.filter(Boolean).length) {
    throw new Error(
      'utoopack does not support extraBabelPresets. Use the webpack bundler for Babel presets.',
    );
  }
  return compatibility;
}
