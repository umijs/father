# Config

father 支持以下配置项。

## 公共配置

### alias

- 类型：`Record<string, string>`
- 默认值：`undefined`

指定源码编译/转换过程中需要处理的别名，其中 Bundles 模式会自动将 `.js`、`.d.ts` 产物中本地路径的别名转换为相对路径。

### define

- 类型：`Record<string, string>`
- 默认值：`undefined`

指定源码编译/转换过程中需要替换的变量，用法与 Webpack [DefinePlugin](https://webpack.js.org/plugins/define-plugin/#usage) 一致。

### extends

- 类型：`string`
- 默认值：`undefined`

指定继承的父配置文件路径。

### extraBabelPlugins

- 类型：`string[]`
- 默认值：`undefined`

指定要额外挂载的 babel 插件。

> 注：在 Bundless 模式下、且 `transformer` 为 `esbuild` 或 `swc` 时，该配置不生效。

### extraBabelPresets

- 类型：`string[]`
- 默认值：`undefined`

指定要额外挂载的 babel 插件集。

> 注：在 Bundless 模式下、且 `transformer` 为 `esbuild` 或 `swc` 时，该配置不生效。

### platform

- 类型：`browser` | `node`
- 默认值：`<auto>`

指定构建产物的目标平台，其中 `esm` 与 `umd` 产物的默认 `platform` 为 `browser`，`cjs` 产物的默认 `platform` 为 `node`；指定为 `browser` 时产物默认兼容至 IE11，指定为 `node` 时产物默认兼容至 Node.js v14。

> 注：Bundless 模式下，如果手动将 `transformer` 指定为 `esbuild`，那么 `browser` 产物默认兼容性为 Chrome51 而不是 IE11。

### sourcemap

- 类型：`boolean`
- 默认值：`false`

为 JavaScript 构建产物生成 `sourcemap` 文件。

> 注：Bundless 模式下 map 对象的 file 字段为空

### targets

- 类型: `Record<string, number>`
- 默认值：`<auto>`

指定源码编译产物的兼容性，不同目标平台和编译模式下的默认值如下：

| `platform` | `transformer` | default value    |
| ---------- | ------------- | ---------------- |
| `browser`  | `babel`       | `{ ie: 11 }`     |
| `browser`  | `esbuild`     | `{ chrome: 51 }` |
| `browser`  | `swc`         | `{ ie: 11 }`     |
| `node`     | `babel`       | `{ node: 14 }`   |
| `node`     | `esbuild`     | `{ node: 14 }`   |
| `node`     | `swc`         | `{ node: 14 }`   |

## 构建配置

father 以构建产物类型划分构建配置，其中 `esm`、`cjs` 产物为 Bundless 构建模式，`umd` 产物为 Bundle 构建模式，另外依赖预打包 `prebundle` 产物也为 Bundle 构建模式。

### esm/cjs

- 类型：`object`
- 默认值：`undefined`

配置将源码转换为 ESModule/CommonJS 产物，支持以下子配置项，也支持覆盖外部的公共配置项。

#### input

- 类型：`string`
- 默认值：`src`

指定要转换的源码目录。

#### output

- 类型：`string`
- 默认值：`<auto>`

指定产物的输出目录，`esm` 产物的默认输出目录为 `dist/esm`，`cjs` 产物的默认输出目录为 `dist/cjs`。

#### transformer

- 类型：`babel` | `esbuild` | `swc`
- 默认值：`<auto>`

指定源码的编译工具，当 `platform` 为 `node` 时，默认值为 `esbuild`，当 `platform` 为 `browser` 时，默认值为 `babel`。

#### overrides

- 类型：`object`
- 默认值：`undefined`

为指定源码子目录覆盖构建配置，例如：

```ts
export default {
  esm: {
    overrides: {
      // 将 server 文件夹下的源码以 node 为目标平台进行编译
      'src/server': {
        platform: 'node',
      },
    },
  },
};
```

#### ignores

- 类型：`string[]`
- 默认值：`undefined`

配置转换过程中需要忽略的文件，支持 glob 表达式，被匹配的文件将不会输出到产物目录。另外，father 会默认忽略源码目录中所有的 Markdown 文件和测试文件。

#### parallel

- 类型：`boolean`
- 默认值：`false`

指定是否开启并发编译，默认关闭。

### umd

- 类型：`object`
- 默认值：`undefined`

配置将源码打包为 UMD 产物，支持以下子配置项，也支持覆盖外部的公共配置项。

#### name

- 类型：`string`
- 默认值：无

指定 umd 包的导出 library 名称，例如：

```ts
export default {
  umd: {
    name: 'fatherDemo',
  },
};
```

默认是全量导出 member exports，需要拆解 `default` 的话，可以通过 `chainWebpack` 配置修改 `libraryExport`，例如：

```ts
export default {
  umd: {
    name: 'fatherDemo',
    chainWebpack: (memo) => {
      memo.output.libraryExport('default');
      return memo;
    },
  },
};
```

#### extractCSS

- 类型：`boolean`
- 默认值：`true`

指定是否提取 CSS 为单独的文件，可通过设置 `extractCSS: false` 关闭。

#### entry

- 类型：`string` | `Record<string, Config>`
- 默认值：`src/index`

指定要打包的源码入口文件，支持配置多入口、并为每个入口文件单独覆盖构建配置，例如：

```ts
export default {
  umd: {
    entry: {
      'src/browser': {},
      'src/server': {
        platform: 'node',
      },
    },
  },
};
```

#### output

- 类型：`string` | `{ path?: string; filename?: string }`
- 默认值：`dist/umd`

指定产物的输出目录及输出文件名，输出目录的默认值为 `dist/umd`，输出文件名在单 `entry` 时默认以 NPM 包名命名、多 `entry` 时默认与源码文件同名。

#### externals

- 类型：`Record<string, string>`
- 默认值：`undefined`

配置源码打包过程中需要处理的外部依赖。

#### chainWebpack

- 类型：`function`
- 默认值：`undefined`

使用 `webpack-chain` 自定义源码打包的 Webpack 配置。

#### postcssOptions

- 类型：`object`
- 默认值：`undefined`

配置源码打包过程中额外的 [PostCSS 配置项](https://webpack.js.org/loaders/postcss-loader/#postcssoptions)。

#### autoprefixer

配置源码打包过程中额外的 [Autoprefixer 配置项](https://github.com/postcss/autoprefixer#options)。

#### theme

配置 Less 源码打包过程中要注入的 Less 变量。

```ts
export default {
  theme: { 'primary-color': '#1890ff' },
};
```

### prebundle

配置项目需要预打包的三方依赖，仅用于 Node.js 工具或框架项目降低安装体积、提升项目稳定性，例如 Umi 这类前端开发框架。

预打包支持以下配置项。

#### output

- 类型：`string`
- 默认值：`compiled`

指定预打包产物的输出目录，默认输出到`compiled`目录。

#### deps

- 类型：`string[]` | `Record<string, { minify?: boolean; dts?: boolean }>`
- 默认值：`undefined`

配置需要预打包的三方依赖，默认开启代码压缩、打包类型声明文件（如果是 TypeScript 项目且包含类型声明），且将每个依赖的打包产物输出到 `[output]/[package_name]` 目录下。

也可以单独对每个依赖进行配置，例如：

```ts
export default {
  prebundle: {
    // 只配置要预打包的依赖
    deps: ['rimraf'],

    // 配置预打包的依赖并指定详细配置
    deps: {
      rimraf: { minify: false },
    },
  },
};
```

#### extraDtsDeps

- 类型：`string[]`
- 默认值：`undefined`

配置仅需要打包 `d.ts` 类型声明文件的依赖。

#### extraExternals

- 类型：`Record<string, string>`
- 默认值：`undefined`

配置预打包过程中要额外处理的外部依赖。father 会默认对以下两类依赖做 external：

1. 预打包的所有目标依赖，并自动 external 到输出目录
2. 当前项目 `package.json` 中声明的 `dependencies`

## 其他配置

### plugins

- 类型：`string[]`
- 默认值：`undefined`

配置额外的 father 插件，可以是插件的路径或者 NPM 包名，如果是相对路径则会从项目根目录开始找。

插件编写方式与 Umi 插件类似，可以在插件函数体中接收 `api` 参数来控制 father 的行为，例如写一个插件修改默认配置：

```ts
// plugin.ts
import type { IApi } from 'father';

export default (api: IApi) => {
  api.modifyConfig((memo) => {
    // 修改 father 配置
    return memo;
  });
};

// .fatherrc.ts
import { defineConfig } from 'father';

export default defineConfig({
  plugins: ['./plugin.ts'],
});
```

### presets

- 类型：`string[]`
- 默认值：`undefined`

配置额外的 father 插件集，可以是插件集的路径或者 NPM 包名，如果是相对路径则会从项目根目录开始找。

插件集的编写方式与 Umi 插件集类似，可以在插件集函数中返回插件配置，例如：

```ts
// preset.ts
import type { IApi } from 'father';

export default (api: IApi) => {
  return {
    presets: [require.resolve('./other-preset')],
    plugins: [require.resolve('./plugin-a'), require.resolve('./plugin-b')],
  };
};
```
