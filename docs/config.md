# Config

father 支持以下配置项。

## 环境变量

### FATHER_TSCONFIG_NAME

- 默认值：tsconfig.name

在许多项目中，供编辑器使用的 `tsconfig` 配置并不适合直接用来构建，因此可能需要提供一个 `tsconfig.build.json` 来定制构建的规则。

```bash
FATHER_TSCONFIG_NAME=tsconfig.build.json father build
```

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

### dts

- 类型：`{ compiler?: 'tsc' | 'tsgo' }`
- 默认值：`{ compiler: 'tsc' }`

配置 TypeScript 类型声明生成方式。默认使用 father 内置的 TypeScript Compiler API；当配置为 `compiler: 'tsgo'` 时，会使用 TypeScript 7 原生编译器（或旧版 tsgo preview）生成 `.d.ts` 文件。

#### 使用原生 TypeScript 编译器

开启 `compiler: 'tsgo'` 会使用 [TypeScript 7 原生编译器](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) 生成类型声明文件，在保留类型检查的同时，可以显著加快类型生成速度。配置名 `tsgo` 会继续保留，以兼容已经启用该能力的项目。

1. 安装 TypeScript 7 作为开发依赖：

```bash
pnpm add typescript@^7 -D
```

如果项目中的工具仍依赖 TypeScript Compiler API，可以按照 [TypeScript 官方推荐的 alias 方案](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)并行安装 TypeScript 7 和 TypeScript 6 兼容包：

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

> TypeScript 7 要求 Node.js 16.20.0 或更高版本。father 会识别直接安装的 `typescript@7` 和官方约定的 `@typescript/native` alias，也会继续识别 `@typescript/native-preview`，以兼容尚未迁移的项目。

2. 在 father 配置中启用原生声明生成：

```ts
export default {
  esm: {
    dts: {
      compiler: 'tsgo',
    },
  },
};
```

> 注：father 会依次识别项目中的 `typescript@7`、`@typescript/native` alias，并回退兼容 `@typescript/native-preview`。为避免所有用户默认安装原生二进制，father 只会在启用 `compiler: 'tsgo'` 时检查这些依赖。

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

#### fullySpecified

- 类型：`boolean`
- 默认值：`false`
- 仅支持 `esm`，作用于整个 ESM 构建（包括 `overrides`）

补全相对导入、再导出和字符串字面量 `import()` 的文件后缀或目录入口，例如 `./utils` → `./utils.js` 或 `./utils/index.js`，并同步处理声明文件。根据实际输出位置解析路径，支持移动了输出目录的 `overrides`。无法解析的相对无后缀路径会报错。

支持 Babel、esbuild、SWC、并行构建、缓存和 watch，并保留 JS/声明文件 source map。该选项不修改外部依赖路径、产物文件名或 package.json。

#### resolveDepSubpath

- 类型：`boolean`
- 默认值：`false`
- 仅支持 `esm`，作用于整个 ESM 构建（包括 `overrides`）

补全没有 `exports` 的依赖子路径，例如 `dayjs/plugin/weekday` → `dayjs/plugin/weekday.js`。同步处理 JavaScript 与声明文件；包入口、具有 `exports` 的依赖，以及无法解析的依赖保持原有路径。该选项独立于 `fullySpecified`，仅在需要兼容这类旧式依赖时开启。

#### outputPackageType

- 类型：`'module'`
- 默认值：`undefined`（不生成或修改包元数据）
- 仅支持 `esm`，作用于整个 ESM 构建（包括 `overrides`）

在 ESM 输出目录（包括 `overrides` 的输出目录）生成包含 `"type": "module"` 的 package.json；复制到输出目录中的 package.json 也会设置此字段，其他字段保持不变。保留既有 `.js` 和 `.d.ts` 文件名，让 Node.js 和 TypeScript 将该目录内的文件按 ESM 解释。启用时，ESM 和 CJS 必须使用互不包含的独立输出目录。

这三个选项均需显式配置，`exports.import` 和根 package.json 的 `type` 不会自动启用它们。不修改现有配置时，原有构建行为保持不变。关闭选项后应执行一次默认的清理构建，避免 `clean: false` 留下先前生成的文件。

这些选项不会将 CommonJS 依赖转换为 ESM，也不会使 CSS 导入或浏览器专用 API 获得 Node.js 支持。完整双格式发布示例见[构建 ESModule 与 CommonJS 产物](./guide/esm-cjs.md#nodejs-原生-esm)。

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

#### bundler

- 类型: `'webpack' | 'utoopack'`
- 默认值: `'webpack'`

用于指定 UMD 构建的 bundler 类型，默认为 `webpack`，utoopack 为 utoo 工具链的 Rust Bundler(对比 Webpack 约有 3x - 5x 的构建速度提升)，参考: [Utoo bundler](https://github.com/umijs/mako?tab=readme-ov-file#%EF%B8%8F-bundler)。

开启 `utoopack` 之后，注意 webpack 相关的一些配置不再兼容，例如 chainWebpack 等。

#### utoopack

- 类型：`Partial<@utoo/pack Config>`
- 默认值：`undefined`

向 Utoopack 透传 UMD 构建配置。用户配置会与 Father 生成的默认配置进行深度合并，同名字段以用户配置为准。

```ts
export default {
  umd: {
    bundler: 'utoopack',
    utoopack: {
      optimization: {
        extractComments: true,
        compress: {
          passes: 3,
        },
        treeShaking: false,
      },
    },
  },
};
```

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

#### transformRuntime

- 类型：`{ absoluteRuntime?: string }`
- 默认值：`{}`

配置 transform-runtime 插件的部分功能。

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
