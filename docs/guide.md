# 指南

## 介绍

father 是一款组件/库打包工具，可以帮助开发者将项目源码输出为 ESModule/CommonJS/UMD 产物用于 NPM 包发布，并且还内置了开箱即用的依赖预打包能力。

## 快速上手

通过 `create-father` 快速创建一个 father 项目：

```bash
$ npx create-father test-father-4
```

脚手架中仅包含最基础的配置，更多配置项及作用可以参考 [配置项文档](./config.md)。

执行构建：

```bash
# 执行全量构建并 watch 变更做增量构建，仅支持 esm/cjs 产物
$ npx father dev

# 执行全量构建
$ npx father build

# 执行依赖预打包
$ npx father prebundle
```

验证产物并发布 NPM 包。
