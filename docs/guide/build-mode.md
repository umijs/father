# 构建模式

## Bundless

Bundless 即文件到文件的构建模式，它不对依赖做任何处理，只对源码做平行编译输出。目前社区里的 [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html)、[unbuild](https://github.com/unjs/unbuild) 及旧版 father 的 babel 模式都是对源码做 Bundless 构建的构建工具。

在 father 4 中，输出 ESModule 产物和 CommonJS 产物时都会采用 Bundless 构建模式，来看一下 father 的 Bundless 构建模式会如何工作。

假定有这样的源码结构：

```bash
.
└── src
    ├── index.less
    ├── index.tsx
    └── util.js
```

配合以下构建配置：

```js
export default {
  esm: { output: 'dist' },
  // 或者
  cjs: { output: 'dist' },
};
```

则会被 father 输出为：

```bash
.
└── dist
    ├── index.d.ts
    ├── index.js
    ├── index.less
    └── util.js
```

可以发现，在 Bundless 模式下，father 对源码的处理逻辑如下：

1. TypeScript 模块会被编译为 JavaScript 模块，并且输出对应的 `.d.ts` 类型文件
2. JavaScript 模块会被编译为 JavaScript 模块，做兼容性处理
3. 其他模块会被直接拷贝输出，不做编译

### 如何选择

Bundless 模式下的产物可以被项目选择性引入，同时也具备更好的可调试性。对于大部分项目而言，Bundless 应该都是最好的选择，这也是社区大部分项目的选择。

关于如何选择 ESModule 产物和 CommonJS 产物，可参考 [构建 ESModule 和 CommonJS 产物](./esm-cjs.md#如何选择) 文档。

## Bundle

Bundle 即将源码打包的构建模式，它以入口文件作为起点、递归处理全部的依赖，然后将它们合并输出成构建产物。目前社区里的 [Webpack](https://webpack.js.org)、[Rollup](https://rollupjs.org/guide/en/) 及旧版 father 的 rollup 模式都是对源码做 Bundle 构建的构建工具。

在 father 4 中，仅输出 UMD 产物时会使用 Bundle 构建模式。来看一下 father 的 Bundle 构建模式会如何工作。

假定有这样的源码结构：

```bash
.
└── src
    ├── index.less
    └── index.tsx # 源码中引入 index.less
```

配合以下构建配置：

```ts
export default {
  umd: { output: 'dist' },
};
```

则会被 father 输出为：

```bash
.
└── dist
    ├── index.min.js
    └── index.min.css
```

可以发现，在 Bundle 模式下，father 会对源码进行打包，最后输出压缩后的 JavaScript 产物和 CSS 产物。

### 如何选择

Bundle 的产物具备更好的一体性。father 中只有 UMD 产物是 Bundle 构建模式，所以在需要 UMD 产物时就随之选择了 Bundle 构建模式。

关于何时选择 UMD 产物，可参考 [构建 UMD 产物](./umd.md#如何选择) 文档。
