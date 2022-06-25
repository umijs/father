# 指南

> father 当前尚处于 alpha 阶段，脚手架在准备中

找个空项目，安装 `father@next`：

```bash
$ npm i father@next -D
```

创建配置文件 `.fatherrc.ts`，并参考 [配置项文档](./config.md) 按需进行配置：

```ts
import { defineConfig } from 'father';

export default defineConfig({
  ...
});
```

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
