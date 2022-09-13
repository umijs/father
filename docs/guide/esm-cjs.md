# 构建 ESModule 与 CommonJS 产物

> 在 father 项目中，ESModule 产物构建与 CommonJS 产物构建类似，所以本章做合并介绍。

## 如何选择

ESModule 是 JavaScript 使用的模块规范，而 CommonJS 是 Node.js 使用的模块规范，这我们已经很熟悉了，所以我们的项目需要输出什么产物，只需要根据使用情况判断即可：

| 产物类型/运行环境 | Browser | Node.js  | Both    |
| ----------------- | ------- | -------- | ------- |
| ESModule          | ✅ 推荐 | 暂不推荐 | ✅ 推荐 |
| CommonJS          | 没必要  | ✅ 推荐  | ✅ 推荐 |

额外说明：

1. 由于 Node.js 社区的 Pure ESM 推进[仍有阻碍](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)，所以为了通用性考虑，目前仍然建议大家为 Node.js 项目产出 CommonJS 产物，未来 father 也会推出同时产出 ESModule 产物的兼容方案，敬请期待
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

在 father 项目中，ESModule 产物及 CommonJS 产物都以 Bundless 模式进行构建，关于 Bundless 模式的介绍可参考 [构建模式 - Bundless](./build-mode.md#bundless)。
