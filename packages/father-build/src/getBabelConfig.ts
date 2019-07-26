interface IGetBabelConfigOpts {
  target: 'browser' | 'node';
  type?: 'esm' | 'cjs';
  typescript: boolean;
  runtimeHelpers?: boolean;
  filePath?: string;
  browserFiles?: {
    [value: string]: any;
  };
  nodeVersion?: number;
  nodeFiles?: {
    [value: string]: any;
  };
}

export default function(opts: IGetBabelConfigOpts) {
  const { target, typescript, type, runtimeHelpers, filePath, browserFiles, nodeFiles, nodeVersion } = opts;
  let isBrowser = target === 'browser';
  // rollup 场景下不会传入 filePath
  if (filePath) {
    if (isBrowser) {
      if (nodeFiles.includes(filePath)) isBrowser = false;
    } else {
      if (browserFiles.includes(filePath)) isBrowser = true;
    }
  }
  const targets = isBrowser ? { browsers: ['last 2 versions', 'IE 10'] } : { node: nodeVersion || 6 };

  return {
    presets: [
      ...(typescript ? [require.resolve('@babel/preset-typescript')] : []),
      [require.resolve('@babel/preset-env'), { targets, modules: type === 'esm' ? false : 'auto' }],
      ...(isBrowser ? [require.resolve('@babel/preset-react')] : []),
    ],
    plugins: [
      require.resolve('babel-plugin-react-require'),
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      require.resolve('@babel/plugin-proposal-export-default-from'),
      require.resolve('@babel/plugin-proposal-export-namespace-from'),
      require.resolve('@babel/plugin-proposal-do-expressions'),
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
      ...(runtimeHelpers
        ? [[require.resolve('@babel/plugin-transform-runtime'), { useESModules: isBrowser && (type === 'esm') }]]
        : []),
      ...(process.env.COVERAGE
        ? [require.resolve('babel-plugin-istanbul')]
        : []
      )
    ],
  };
}
