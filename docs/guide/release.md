# 发布

通常仅需 4 步即可完成普通 NPM 包发布，monorepo 项目请参考各自 monorepo 方案的发包实践。

## 前置工作

1. 执行 `npm whoami` 查看当前用户是否已经登录，如果未登录则执行 `npm login`
2. 检查 `package.json` 中的 NPM 包名及 `publishConfig` 是否符合预期

## 更新版本号

使用 `npm version` 命令更新版本号，例如：

```bash
# 发布一个 patch 版本
$ npm version patch -m "build: release %s"
```

该命令将会自动生成 git tag 及 git commit，并将版本号更新到 `package.json` 中。更多用法可参考 NPM 文档：https://docs.npmjs.com/cli/v8/commands/npm-version

## 构建及发布

father 4 的脚手架默认已将 [项目体检命令](./doctor.md) 及构建命令配置到 `prepublishOnly` 脚本中：

```diff
  "scripts": {
    ...
+   "prepublishOnly": "father doctor && npm run build"
  },
```

所以我们只需要执行发布即可：

```bash
# NPM 会自动执行 prepublishOnly 脚本然后完成发布
$ npm publish
```

## 后置工作

1. **功能验证：**使用测试项目下载新发布的 NPM 包，验证功能是否正常
2. **更新日志：**将本次发布的变更通过 GitHub 的 Release Page 进行描述，也可以选择在前置工作中将变更描述写入 `CHANGELOG.md` 文件（未来 father 会提供自动化的更新日志生成能力，敬请期待）
