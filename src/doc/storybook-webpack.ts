import { join } from 'path';

const cwd = process.cwd();
const pkg = require(join(cwd, 'package.json'));

module.exports = (baseConfig, env, config) => {
  config.module.rules.push({
    test: /\.tsx?$/,
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          context: cwd,
          configFile: join(__dirname, '../../template/tsconfig.json'),
          transpileOnly: true,
        },
      },
      require.resolve('react-docgen-typescript-loader'),
    ],
  });

  config.resolve.extensions.push('.ts', '.tsx');
  config.resolve.alias = {
    ...config.resolve.alias,
    [pkg.name]: cwd,
  };
  config.module.rules.push({
    test: /\.less$/,
    use: [
      {
        loader: 'style-loader',
      },
      {
        loader: 'css-loader',
      },
      {
        loader: 'less-loader',
        options: {
          javascriptEnabled: true,
        },
      },
    ],
  });
  config.resolve.extensions.push('.less');

  // Resolve
  config.resolve.modules = [
    ...(config.resolve.modules || []),
    join(cwd, 'node_modules'),
    join(__dirname, '../../node_modules'),
  ];

  // Remove core-js
  delete config.resolve.alias['core-js'];

  return config;
};
