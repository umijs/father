# 构建 UMD 产物

## 如何选择

只有在满足如下任意条件的情况下，才需要选择输出 UMD 产物：

1. 项目的用户可能需要将该依赖做 external 处理、并在 HTML 中通过 script 标签直接引入 CDN 上的产物（类似 React 或 antd）
2. 项目需要产出编译后的样式表给用户使用，例如将 Less 文件以特定的变量编译成 CSS 文件，常见于基于 antd、又需要自定义主题的组件库

## 如何构建

只需要使用 `umd` 配置项，再执行 `father build` 即可产出 UMD 产物：

```js
// .fatherrc.js
export default {
  // 以下为 umd 配置项启用时的默认值，有自定义需求时才需配置
  umd: {
    entry: 'src/index', // 默认构建入口文件
  },
};
```

更多配置项可参考 [配置项](../config.md)。

在 father 项目中，UMD 产物以 Bundle 模式进行构建，关于 Bundle 模式的介绍可参考 [构建模式 - Bundle](./build-mode.md#bundle)。
