# 构建 ESModule 与 CommonJS 产物

> 在 father 项目中，ESModule 产物构建与 CommonJS 产物构建类似，所以本章做合并介绍。

## 如何选择

Node.js 支持 ESModule 和 CommonJS，浏览器及前端构建工具主要使用 ESModule。可以根据消费方选择产物：

| 产物类型/运行环境 | Browser | Node.js | Both    |
| ----------------- | ------- | ------- | ------- |
| ESModule          | ✅ 推荐 | ✅ 支持 | ✅ 推荐 |
| CommonJS          | 没必要  | ✅ 推荐 | ✅ 推荐 |

额外说明：

1. 为 Node.js 发布 ESModule 时，使用下文的原生 ESM 配置；需要兼容 CommonJS 消费方时，可以同时产出 CJS，并使用条件导出区分入口。
2. 对于 Browser 运行环境，CommonJS 产物是没必要的，无论哪种模块构建工具都能帮我们解析，加上 Vite 这类使用原生 ESModule 产物的构建工具已经成熟，使用 ESModule 才是面向未来的最佳选择
3. Both 是指构建产物要同时用于 Browser 和 Node.js 的项目，比如 react-dom、umi 等

## 如何构建

只需要使用 `esm` 及 `cjs` 配置项，再执行 `father build` 即可产出 ESModule 和 CommonJS 产物：

```js
// .fatherrc.js
export default {
  // 以下为 esm 配置项启用时的默认值，有自定义需求时才需配置
  esm: {
    input: 'src', // 默认编译目录
    platform: 'browser', // 默认构建为 Browser 环境的产物
    transformer: 'babel', // 默认使用 babel 以提供更好的兼容性
  },
  // 以下为 cjs 配置项启用时的默认值，有自定义需求时才需配置
  cjs: {
    input: 'src', // 默认编译目录
    platform: 'node', // 默认构建为 Node.js 环境的产物
    transformer: 'esbuild', // 默认使用 esbuild 以获得更快的构建速度
  },
};
```

更多配置项可参考 [配置项](../config.md)。

## Node.js 原生 ESM

传统 `module` 字段供打包工具使用，并不保证其中的路径能被 Node.js 直接加载。father 可以按包类型选择产物后缀，并同步补全模块引用和声明文件：

```ts
// .fatherrc.ts
export default {
  esm: {
    output: 'es',
    platform: 'node',
    autoExtension: true,
  },
  cjs: { output: 'lib', autoExtension: true },
};
```

在 `package.json` 中分别声明两个入口及类型入口：

```json
{
  "type": "commonjs",
  "main": "./lib/index.js",
  "module": "./es/index.mjs",
  "types": "./lib/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./es/index.d.mts",
        "default": "./es/index.mjs"
      },
      "require": {
        "types": "./lib/index.d.ts",
        "default": "./lib/index.js"
      }
    }
  },
  "files": ["es", "lib"]
}
```

这个例子明确使用 CommonJS 根包，因此 ESM 产物为 `.mjs` / `.d.mts`，CJS 产物为 `.js` / `.d.ts`。若改为 `"type": "module"`，则分别变为 `.js` / `.d.ts` 与 `.cjs` / `.d.cts`，需要同步更新发布入口。Father 不会生成额外的 package.json，也不会修改根包元数据。

`autoExtension` 必须显式开启，`exports.import` 只声明消费入口。TypeScript 项目还需在 `tsconfig.json` 开启 `declaration`。产物中的相对导入、再导出、动态导入和 CJS `require()` 默认同步指向实际文件，声明中的路径也会补全；可用 `redirect.js.extension` 和 `redirect.dts.extension` 分别控制。

外部依赖路径默认保持原样。如果依赖使用 `dayjs/plugin/weekday` 这类没有 `exports` 的子路径，可以额外设置 `esm.resolveDepSubpath: true`。具有 `exports` 的依赖始终保留公共导入路径。

已有的 `esm: {}` / `cjs: {}` 构建行为保持不变。原有 `esm` 已能保留 ESM 语法，当源码路径和包类型符合要求时也能直接被 Node.js 加载。新选项自动处理产物后缀和路径，应用代码及依赖仍需适用于 Node.js。

在 father 项目中，ESModule 产物及 CommonJS 产物都以 Bundless 模式进行构建，关于 Bundless 模式的介绍可参考 [构建模式 - Bundless](./build-mode.md#bundless)。
