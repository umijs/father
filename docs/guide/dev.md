# 开发

将构建配置设置完毕后，即可开始开发。

## 实时编译产物

开发过程中我们需要实时编译产物，以便进行调试、验证：

```bash
# 执行 dev 命令，开启实时编译
$ father dev
```

一旦源码或配置文件发生变化，产物将会实时增量编译到输出目录。

## 在项目中调试

在测试项目中，使用 `npm link` 命令将该项目链接到测试项目中进行调试、验证：

```bash
$ cd test-project
$ npm link /path/to/your-father-project .
```

开发、验证完成后，即可 [发布](./release.md) 该 NPM 包。
