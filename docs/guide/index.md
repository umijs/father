# 指南

## 介绍

father 是一款 NPM 包研发工具，能够帮助开发者更高效、高质量地研发 NPM 包、生成构建产物、再完成发布。它主要具备以下特性：

- ⚔️ **双模式构建：** 支持 Bundless 及 Bundle 两种构建模式，ESModule 及 CommonJS 产物使用 Bundless 模式，UMD 产物使用 Bundle 模式
- 🎛 **多构建核心：** Bundle 模式使用 Webpack 作为构建核心，Bundless 模式支持 esbuild、Babel 及 SWC 三种构建核心，可通过配置自由切换
- 🔖 **类型生成：** 无论是源码构建还是依赖预打包，都支持为 TypeScript 模块生成 `.d.ts` 类型定义
- 🚀 **持久缓存：** 所有产物类型均支持持久缓存，二次构建或增量构建只需『嗖』的一下
- 🩺 **项目体检：** 对 NPM 包研发常见误区做检查，让每一次发布都更加稳健
- 🏗 **微生成器：** 为项目追加生成常见的工程化能力，例如使用 jest 编写测试
- 📦 **依赖预打包：** 开箱即用的依赖预打包能力，帮助 Node.js 框架/库提升稳定性、不受上游依赖更新影响（实验性）

## 兼容性

father 本身需要在 Node.js v14 以上的环境中运行，使用前请确保已安装 Node.js v14 及以上版本。

father 产出的 Node.js 产物默认兼容到 Node.js v14，Browser 产物默认兼容到 ES5（IE11）。

## 快速上手

通过 `create-father` 快速创建一个 father 项目：

```bash
$ npx create-father my-father-project
```

> 脚手架中仅包含最基础的配置，更多配置项及作用可以参考 [配置项文档](../config.md)。

执行构建：

```bash
$ npx father build
```

查看 `dist` 文件夹，可以看到构建产物已被生成出来。恭喜你，已经完成了第一个 father 项目的构建工作 🎉

接下来，你可以查看其它文档了解 father 的更多功能：

- [Bundless 与 Bundle 构建模式](./build-mode.md)
- [构建 ESModule 和 CommonJS 产物](./esm-cjs.md)
- [构建 UMD 产物](./umd.md)
- [依赖预打包](./pre-bundle.md)
- [执行项目体检](./doctor.md)
- [开发指南](./dev.md)
- [发布指南](./release.md)
