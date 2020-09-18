import path from 'path';
import { RollupOptions, OutputOptions } from 'rollup';
import url from '@rollup/plugin-url';
import json from '@rollup/plugin-json';
import inject from '@rollup/plugin-inject';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import svgr from '@svgr/rollup';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import autoprefixer from 'autoprefixer';
import { IConfig } from 'father-types';
import { Service } from '@umijs/core';

const MODULE_EXTS = ['.js', '.jsx', '.ts', '.tsx', '.es6', '.es', '.mjs'];

/**
 * get rollup plugins by config
 * @param opts      father options
 * @param isMinCSS  minimize CSS
 */
function getPlugins(
  opts: IGetRollupConfig,
  isMinCSS?: boolean,
): RollupOptions['plugins'] {
  const { moduleType, tsconfig = {} } = opts;
  const config = opts.config.rollup!;
  const plugins = [];

  // normal plugins
  plugins.push(url(), svgr(), json());

  // register @rollup/plugin-node-resolve
  plugins.push(
    resolve({
      mainFields: ['browser', 'jsnext:main', 'module', 'main'],
      extensions: MODULE_EXTS,
      ...(config.resolve || {}),
    }),
  );

  // register @rollup/plugin-inject
  if (config.inject) {
    plugins.push(inject(config.inject));
  }

  // register @rollup/plugin-replace
  if (config.replace) {
    plugins.push(replace(config.replace));
  }

  // register @rollup/plugin-typescript
  if (
    ['.ts', '.tsx'].includes(
      path.extname(Object.values(config.entry!)[1] as string),
    )
  ) {
    plugins.push(typescript(tsconfig));
  }

  // register @rollup/plugin-commonjs, always enable in umd
  if (config.commonjs || moduleType === 'umd') {
    plugins.push(
      commonjs({
        ...config.commonjs,
        include: config.commonjs.include || /node_modules/,
      }),
    );
  }

  // register rollup-plugin-terser
  if (
    typeof moduleType === 'string' &&
    config[moduleType] &&
    // for esm & cjs
    (config[moduleType].minify ||
      // for esm
      config[moduleType].mjs ||
      // for umd
      config[moduleType].minFile)
  ) {
    plugins.push(
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      }),
    );
  }

  // register rollup-plugin-postcss
  plugins.push(
    postcss({
      // whether extrat CSS into a single file
      // CSS will inject into js if it is false
      extract: config.extractCSS,
      minimize: isMinCSS,
      use: [
        [
          'less',
          // available opts: http://lesscss.org/usage/#less-options
          opts.config.postCSS?.less || {},
        ],
        [
          'sass',
          // available opts: https://www.npmjs.com/package/node-sass#options
          opts.config.postCSS?.sass || {},
        ],
      ],
      plugins: [
        autoprefixer({
          overrideBrowserslist: opts.config.targets as any,
        }),
        ...(opts.config.postCSS?.plugins || []),
      ],
    }),
  );

  return plugins.concat(config.plugins || []);
}

/**
 * get externals by dependencies
 */
function getExternals(opts: IGetRollupConfig) {
  const { pkg, config, moduleType } = opts;
  const deps = Object.keys(pkg.peerDependencies || {}).concat(
    config.rollup?.externals?.filter(item => !item.startsWith('!')) || [],
  );

  // only external peerDeps for umd
  if (moduleType !== 'umd') {
    deps.push(...Object.keys(pkg.dependencies || {}));
  }

  return deps;
}

export interface IGetRollupConfig {
  cwd: string;
  pkg: typeof Service.prototype.pkg;
  moduleType: OutputOptions['format'];
  config: IConfig;
  tsconfig?: any;
}

export default (opts: IGetRollupConfig): RollupOptions[] => {
  const rollupOptions: RollupOptions[] = [];
  const { cwd, moduleType, config } = opts;
  const [outputName, entry] = Object.entries(config.rollup!.entry!)[0];
  const input = path.join(cwd, entry);
  const plugins = getPlugins(opts);
  const externalExclude =
    config.rollup?.externals?.filter(item => item.startsWith('!')) || [];
  const externals = getExternals(opts);
  // addon suffix for output file, eg: name{.suffix}.js
  const fileAddonSuffix = moduleType === 'cjs' ? '' : `.${moduleType}`;

  function externalTester(id: string) {
    if (externalExclude.includes(id)) {
      return false;
    }

    // extract package name from [@group/pkg]/a/b/c or [pkg]/a/b/c
    const pkg = id.match(/^((?:@[\w-]+\/)?[^\/]+)/)?.[0] || '';

    return externals.includes(pkg);
  }

  const standardOptions = {
    input,
    output: {
      format: moduleType,
      file: path.join(
        cwd,
        `dist/${config[moduleType as string]?.file ||
          outputName}${fileAddonSuffix}.js`,
      ),
    },
    plugins,
    external: externalTester,
  };
  const standardOptionsOutput = standardOptions.output as OutputOptions;

  // push standard options
  rollupOptions.push(standardOptions);

  // configure specific options for umd bundle
  if (moduleType === 'umd' && config.umd) {
    // add umd output options
    standardOptionsOutput.name = config.umd.name || outputName;

    if (config.umd.sourcemap) {
      standardOptionsOutput.sourcemap = true;
    }

    if (config.umd.globals) {
      standardOptionsOutput.globals = config.umd.globals;
    }

    // add umd plugins
    standardOptions.plugins!.push(
      replace({
        'process.env.NODE_ENV': JSON.stringify('development'),
      }),
    );

    // output .min.js bundle
    if (config.umd.minFile) {
      rollupOptions.push({
        ...standardOptions,
        output: {
          ...standardOptionsOutput,
          file: standardOptionsOutput.file!.replace(/\.js$/, '.min.js'),
        },
        plugins: (getPlugins(opts) || []).concat(
          replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
          }),
        ),
      });
    }
  }

  // configure specific options for mjs bundle
  if (moduleType === 'esm' && config[moduleType]?.mjs) {
    rollupOptions.push({
      ...standardOptions,
      output: {
        ...standardOptionsOutput,
        file: standardOptionsOutput.file!.replace(/\.js$/, '.mjs'),
      },
      plugins: standardOptions.plugins!.concat(
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
        }),
      ),
    });
  }

  return rollupOptions;
};
