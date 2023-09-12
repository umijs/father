# 项目体检

father 的项目体检能力可以帮助我们发现项目的潜在问题，并提供改进建议，只需执行：

```bash
$ father doctor
```

目前包含如下规则。

## PACK_FILES_MISSING

- 级别：错误 ❌
- 说明：

有配置 files 字段但却不包含构建产物目录，这会导致发布后的 NPM 包找不到对应的模块。

## EFFECTS_IN_SIDE_EFFECTS

- 级别：错误 ❌
- 说明：

`package.json` 文件中的 `sideEffects` 字段配置有误，例如：

1. 构建产物里有引入样式文件，却将 `sideEffects` 配置为 `false`，这会导致实际项目编译后丢失样式
2. 使用了 Rollup.js 不兼容的通配方式 `*.css`，这在 Webpack 项目中意味着匹配全部的 CSS，但在 Rollup.js 项目中意味着顶层的 CSS

## PHANTOM_DEPS

- 级别：错误 ❌
- 说明：

源码中使用了某个依赖，但却没有声明在 `dependencies` 中，这会导致项目引用到[幽灵依赖](https://rushjs.io/pages/advanced/phantom_deps/)，它可能不存在，也可能是错误的版本，使得项目存在运行失败的风险。

## CASE_SENSITIVE_PATHS

- 级别：错误 ❌
- 说明：

源码中引入路径的文件大小写与磁盘上的大小写不符，如果开发者使用的是大小写不敏感的操作系统（比如 Windows 和 macOS 的默认配置），由于编译不会报错，可能不会发现该问题，但 NPM 包发布后在大小写敏感的操作系统上编译时则会找不到模块。

## TSCONFIG_RISK

- 级别：错误 ❌
- 说明：

检查 tsconfig.json 配置中存在的风险，目前支持检测如下风险：

1. 当 `compilerOptions.declaration` 启用时，如果配置了 `include` 且没有包含任何 bundless 构建的源文件，则认定为存在 `.d.ts` 产物缺失风险，会进行报错

## PREFER_PACK_FILES

- 级别：警告 ⚠️
- 说明：

建议使用 `files` 字段声明要发布到 NPM 的文件，以减小 NPM 包安装体积。

## PREFER_NO_CSS_MODULES

- 级别：警告 ⚠️
- 说明：

不建议使用 CSS Modules，用户难以覆写样式，且会给用户项目增加额外的编译成本

## PREFER_BABEL_RUNTIME

- 级别：警告 ⚠️
- 说明：

建议安装 `@babel/runtime` 到 `dependencies`，以节省构建产物大小。

> 注：该规则仅在 `transformer` 是 `babel` 且 `platform` 是 `browser` 时生效

## DUP_IN_PEER_DEPS

- 级别：警告 ⚠️
- 说明：

`peerDependencies` 和 `dependencies` 里有相同依赖，建议根据项目实际需要去掉其中一个。

如果你有其他的 NPM 包的研发建议，欢迎评论到 [issue](https://github.com/umijs/father-next/issues/36) 中，规则讨论通过后将会被添加。

## PREFER_PEER_DEPS

- 级别：警告 ⚠️
- 说明：

有多实例风险的依赖声明应该放入 `peerDependencies` 而不是 `dependencies`，比如 `react`、`antd`。
