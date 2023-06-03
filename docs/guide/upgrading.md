# 从 father v2 或 father-build v1 升级

> 注：father v2 = father-build v1 + 文档能力 + 其他工程化能力，两者在构建功能上是一回事

按照如下步骤，可手动将组件库构建从 father v2 或 father-build v1 升级到 father 4

## 不兼容变更

1. **不再支持所有 rollup 构建模式**，如果项目源码需要打包，请输出 UMD 构建产物（基于 Webpack）；如果不需要打包，请以 Bundless 形式输出 ESModule 或 CommonJS 产物（基于 Babel/esbuild），具体可参考 [构建模式](./build-mode.md) 文档
2. **不再内置 CSS Modules 支持**，组件库不建议使用 CSS Modules，会使得样式难以覆写、且会给用户项目带来额外的编译成本
3. **Bundless 模式不再支持编译非 JavaScript 文件**，样式表交给实际项目编译会更加灵活，如果组件库有自定义主题的需求，可以考虑使用输出 UMD 产物，具体可参考 [构建 UMD 产物 - 如何选择](./umd.md#如何选择)
4. **不再内置组件库文档方案**，如果此前使用 Docz 文档方案，请参考 [文档](https://github.com/umijs/father/issues/241) 迁移到 dumi；如果是新项目，可以直接使用 [dumi 脚手架工具](https://d.umijs.org/guide/initialize) 初始化 React 组件库项目
5. **不再内置 monorepo 支持**，请将 father 4 结合各 monorepo 自己的方案做源码构建，比如 pnpm workspace 可参考 [Umi 4 的仓库](https://github.com/umijs/umi)

## package.json 升级

```diff
{
  "scripts": {
+   "dev": "father dev",
    "build": "father build",
    ...
  },
  "devDependencies": {
    ...
-   "father": "^2.0.0"
+   "father": "^4.0.0"
  }
}
```

## 配置文件升级

首先，建议从 `.fatherrc.js` 改用 `.fatherrc.ts`，以获得配置的自动补全，然后将各项配置做更新升级：

```diff
+ import { defineConfig } from 'father';

- export default {
+ export default defineConfig({
    ...
- }
+ });
```

### 废弃的配置项

```diff
export default defineConfig({
  cjs: {
    # 已废弃，Bundless 构建模式不需要指定输出文件
-   file: 'xxx',
    # 已废弃，不支持配置
-   lazy: true,
    # 已废弃，Bundless 构建模式不压缩
-   minify: true,
  },
  esm: {
    # 已废弃，Bundless 构建模式不需要指定输出文件
-   file: 'xxx',
    # 已废弃，后续会提供更简单的 pure esm 方案
-   mjs: true,
    # 已废弃，Bundless 构建模式不压缩
-   minify: true,
  },
  umd: {
    # 已废弃，会自动复用 entry 文件名，有特殊需要可走 chainWebpack 配置
-   file: 'xxx',
    # 已废弃，统一生成 min 版本
-   minFile: true,
  },
  # 已废弃，不支持配置
- cssModules: true,
  # 已废弃，不允许关闭类型检查
- disableTypeCheck: true,
  # 已废弃，请迁移到 dumi
- doc: {},
  # 已废弃，不支持配置
- file: 'xxx',
  # 已废弃，Bundless 模式不再编译非 JavaScript 文件
- lessInBabelMode: {},
  # 已废弃，改为约定式，只要 dependencies 里包含 @babel/runtime 则默认为 true
- runtimeHelpers: true,
  # 仅 umd 构建支持，改用 umd: { extractCSS: boolean }，默认值为 true
- extractCSS: true,
  # 已废弃，和 extractCSS 作用重复
- injectCSS: true,
  # 已废弃，不再关心 monorepo
- pkgFilter: {},
- pkgs: [],
  # 已废弃，Rollup 特定配置项均不支持配置
- extraRollupPlugins: [],
- include: {},
- lessInRollupMode: {},
- nodeResolveOpts: {},
- sassInRollupMode: {},
});
```

### 更新的配置项

```diff
export default defineConfig({
  // 不支持字符串值，改用下方对象值
- esm: 'babel',
  esm: {
    # 改用 alias: { 'antd/lib' : 'antd/es' } 代替
-   importLibToEs: true,
    # 用 transformer 配置项代替，可选值参考：https://github.com/umijs/father/blob/master/docs/config.md#transformer
-   type: 'rollup',
    # 默认值为 dist/esm，如果想保持原目录，需增加 output 配置项
+   output: 'es'
  },
  // 不支持字符串值，改用下方对象值
- cjs: 'babel',
  cjs: {
    # 用 transformer 配置项代替，可选值参考：https://github.com/umijs/father/blob/master/docs/config.md#transformer
-   type: 'rollup',
    # cjs 产物的默认值为 node，如果升级前产物是用于浏览器的，那么需要手动配置为 browser
+   platform: 'browser',
    # 默认值为 dist/cjs，如果想保持原目录，需增加 output 配置项
+   output: 'lib'
  },
  umd: {
    # 改用 externals 代替
-   globals: {},
    # 默认值为 dist/umd，如果想保持原目录，需增加 output 配置项
+   output: 'dist'
  },
  # 仅 umd 构建支持，改用 umd: { autoprefixer: {} }
- autoprefixer: {},
  # 仅 umd 构建支持，改用 umd: { entry: 'xxx' }
- entry: 'xxx',
  # 仅 umd 构建支持，改用 umd: { postcssOptions: { plugins: [] } }
- extraPostCSSPlugins: []
  # 仅 umd 构建支持，改用 umd: { entry: { 'src/xx': {} } }
- overridesByEntry: {},
  # 改用 targets 配置项
- nodeVersion: 14,
  # 改用 platform 配置项
- target: 'node',
  # 改用 esm/cjs: { overrides: {}, ignores: [] } 实现
- browserFiles: [],
- nodeFiles: [],
  # 仅 umd 构建支持，改用 umd: { externals: {} }
- externalsExclude: {},
- extraExternals: {},
  # 改用 define 配置项
- inject: {},
- replace: {},
});
```

## 其他功能升级

### test

不再内置，可通过 `father g jest` 生成测试配置。

### precommit

不再内置，可通过 `father g lint`、`father g commitlint` 等命令生成各类提交预检查脚本。

## 升级验证

如果升级前使用的是 babel 模式，那么建议通过对比产物验证升级差异，步骤如下：

1. 从 `node_modules` 将旧版本产物复制到项目中，并使用 `git commit` 命令提交一条临时记录
2. 使用新配置执行 `father build`，确保产物可以成功构建
3. 使用 `git diff` 命令对比前后产物差异，产物没有逻辑性差异即验证通过（由于 babel 版本升级，存在 helpers 引入变化是正常的）
4. 重置步骤 1 的临时提交记录

如果升级前使用的是 rollup 模式（配置 `umd` 也是基于 rollup 构建），那么建议寻找测试项目验证升级差异，步骤如下：

1. 使用新配置执行 `father build`，确保产物可以成功构建
2. 参考 [开发 - 在项目中调试](./dev.md#在项目中调试) 进行产物功能验证，功能正常则验证通过

至此，恭喜你完成 father 的升级！
