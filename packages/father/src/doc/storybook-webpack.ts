import { join } from 'path';

const cwd = process.cwd();
const pkg = require(join(cwd, 'package.json'));

module.exports = ({ config, ...rest }) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve('babel-loader'),
    options: {
      presets: [
        '@babel/preset-typescript',
        [
          'umi',
          {
            targets: {
              browsers: ['last 2 versions'],
            },
          },
        ],
      ],
    },
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
