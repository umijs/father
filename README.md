# father

<img src="https://www.youngisthan.in/wp-content/uploads/2018/09/Fathers-day.jpg" width="160" />

Library toolkit based on rollup, docz, storybook, jest, prettier and eslint.

[![codecov](https://codecov.io/gh/umijs/father/branch/master/graph/badge.svg)](https://codecov.io/gh/umijs/father)
[![NPM version](https://img.shields.io/npm/v/father.svg?style=flat)](https://npmjs.org/package/father)
[![CircleCI](https://circleci.com/gh/umijs/father/tree/master.svg?style=svg)](https://circleci.com/gh/umijs/father/tree/master)
[![GitHub Actions status](https://github.com/umijs/father/workflows/Node%20CI/badge.svg)](https://github.com/umijs/father)
[![NPM downloads](http://img.shields.io/npm/dm/father.svg?style=flat)](https://npmjs.org/package/father)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

[视频教程：利用 umi-library（father） 做组件打包](https://www.bilibili.com/video/av47853431)。

## Features

* ✔︎ 基于 [docz](https://www.docz.site/) 的文档功能
* ✔︎ 基于 [rollup](http://rollupjs.org/) 和 babel 的组件打包功能
* ✔︎ 支持 TypeScript
* ✔︎ 支持 cjs、esm 和 umd 三种格式的打包
* ✔︎ esm 支持生成 mjs，直接为浏览器使用
* ✔︎ 支持用 babel 或 rollup 打包 cjs 和 esm
* ✔︎ 支持多 entry
* ✔︎ 支持 lerna
* ✔︎ 支持 css 和 less，支持开启 css modules
* ✔︎ 支持 test
* ✔︎ 支持用 prettier 和 eslint 做 pre-commit 检查

## Installation

Install `father` via yarn or npm.

> 如果只做组件打包，不需要文档，可安装 father-build，使用和配置同 father。

```bash
$ yarn add father
```

## Usage

```bash
# Bundle library
$ father build

# dev with doc
$ father doc dev

# build doc
$ father doc build

# deploy doc to github.io
$ father doc deploy

# test
$ father test
$ father test --coverage
```

## Cli

### build

打包库，输出多种格式的文件。

```bash
# Normal build
$ father build

# Bundle src/foo.js with esm=rollup, cjs=rollup and umd, and specify the output filename with bar
$ father build --esm --cjs --umd --file bar src/foo.js
Success!
$ tree ./dist
./dist
  - bar.js
  - bar.esm.js
  - bar.umd.js
  - bar.umd.min.js
```

### doc

doc 包含 dev 和 build 两个子命令。

```bash
$ father doc dev
$ father doc build
$ father doc deploy
```

所有的命令行参数会透传给 docz，详见 [docz.site#project-configuration](https://www.docz.site/docs/project-configuration)。

注：

1. 不能传 `--config` 参数，通过 `--config` 指定的文件内容可全部配置在 `.fatherrc.js` 的 [doc](#doc) 配置里。
2. 使用 `deploy` 之前请先执行 `build` 命令，文档部署后域名为：`https://yourname.github.io/your-repo`。

## Config

新建 `.fatherrc.js` 文件进行配置。

比如：

```js
export default {
  entry: 'src/foo.js',
  doc: {
    themeConfig: { mode: 'dark' },
    base: '/your-repo'
  },
}
```

注意：

1. lerna 项目可以为每个 package 单独配，并且可以继承根目录的 `.fatherrc.js` 配置
2. 配置文件支持 es6 和 TypeScript

### Options

#### entry

指定入口文件。

* Type: `string | string[]`
* Default：`src/index.js`

注：事实上，我们会依次找 `src/index.tsx`, `src/index.ts`, `src/index.jsx`, `src/index.js`，如果存在，则会作为默认的 entry。如果库文件为 `typescript`，则需要在根目录配置`tsconfig.json`，否则会编译错误。

#### file

指定输出文件。

* Type: `string`
* Default: 与 entry 相同的文件名，esm 会加 `.esm.js` 后缀，umd 会加 `.umd[.min].js` 后缀

注：

1. entry 为数组时，不可配置 file，因为不能多个 entry 输出到同一个文件
2. 为不同 entry 指定不同的输出文件名时，可通过 [overridesByEntry](#overridesbyentry) 实现

#### esm

是否输出 esm 格式，以及指定 esm 格式的打包方式等。

* Type: `"rollup" | "babel" | { type, file, mjs } | false`
* Default: `false`

esm 为 `rollup` 或 `babel` 时，等同于配置了 `{ type: "rollup" | "babel" }`。

#### esm.type

指定 esm 的打包类型，可选 `rollup` 或 `babel`。

* Type: `"rollup" | "babel"`
* Default: `undefined`

#### esm.file

指定 esm 的输出文件名。

* Type: `string`
* Default: `undefined`

#### esm.mjs

是否同时输出一份给浏览器用的 esm，以 `.mjs` 为后缀。

* Type: `boolean`
* Default: `false`

注：

1. mjs 目前不通用，除非你知道这是什么，否则不要配置。

#### esm.minify

是否压缩 esm 格式。

* Type: `boolean`
* Default: `false`

通常不需要配置，除非你发布到 npm 的代码需要保密。

#### esm.importLibToEs

是否在 esm 模式下把 import 项里的 `/lib/` 转换为 `/es/`。

* Type: `boolean`
* Default: `false`

比如 `import 'foo/lib/button';`，在 cjs 模式下会保持原样，在 esm 模式下会编译成 `import 'foo/es/button';`。

#### cjs

是否输出 cjs 格式，以及指定 cjs 格式的打包方式等。

- Type: `"rollup" | "babel" | { type, file } | false`
- Default: `false`

cjs 为 `rollup` 或 `babel` 时，等同于配置了 `{ type: "rollup" | "babel" }`。

#### cjs.type

指定 cjs 的打包类型，可选 `rollup` 或 `babel`。

- Type: `"rollup" | "babel"`
- Default: `undefined`

#### cjs.file

指定 cjs 的输出文件名。

- Type: `string`
- Default: `undefined`

#### cjs.minify

是否压缩 cjs 格式。

* Type: `boolean`
* Default: `false`

通常不需要配置，除非你发布到 npm 的代码需要保密。

#### cjs.lazy

是否开启 lazy require。

* Type: `boolean`
* Default: `false`

对于工具来说推荐开启，可加速命令行执行速度，同时减少依赖和耦合。

#### umd

是否输出 umd 格式，以及指定 umd 的相关配置。

* Type: `{ globals, name, minFile, file, sourcemap } | false`
* Default: `false`

#### umd.globals

指定 rollup 的 [globals](https://rollupjs.org/guide/en#output-globals) 配置。

#### umd.name

指定 rollup 的 [name](https://rollupjs.org/guide/en#output-name) 配置。

* Type: `string`
* Default: `${camelCase(basename(pkg.name))}`

#### umd.minFile

是否为 umd 生成压缩后的版本。

* Type: `boolean`
* Default: `false`

#### umd.file

指定 umd 的输出文件名。

- Type: `string`
- Default: `undefined`

#### umd.sourcemap

是否同步输出sourcemap。

- Type: `boolean`
- Default: `undefined`

#### autoprefixer

配置参数传给 autoprefixer，详见 [autoprefixer#options](https://github.com/postcss/autoprefixer#options)，常用的有 `flexbox` 和 `browsers`。

比如：

```js
export default {
  autoprefixer: {
    browsers: [
      'ie>8',
      'Safari >= 6',
    ],
  },
}
```

#### cssModules

配置是否开启 css modules。

* Type: `boolean | object`
* Default: `false`

默认是 `.module.css` 走 css modules，`.css` 不走 css modules。配置 `cssModules` 为 `true` 后，全部 css 文件都走 css modules。（less 文件同理）

如果配置了 object，会被透传给 [postcss-modules](https://github.com/css-modules/postcss-modules)。

比如，要定制 css modules 的样式名前缀，

```js
export default {
  cssModules: {
    generateScopedName: 'foo-bar_[name]__[local]___[hash:base64:5]',
  },
}
```

#### extractCSS

配置是否提取 css 为单独文件。

* Type: `boolean`
* Default: `false`

#### injectCSS

是否在 \<head>里注入css, 如果`extractCSS: true`，则为`false`

* Type: `boolean | function`
* Default: `true`

#### extraBabelPresets

配置额外的 babel preset。

* Type: `array`
* Default: `[]`

#### extraBabelPlugins

配置额外的 babel plugin。

* Type: `array`
* Default: `[]`

比如配置 babel-plugin-import 按需加载 antd，

```js
export default {
  extraBabelPlugins: [
    ['babel-plugin-import', {
      libraryName: 'antd',
      libraryDirectory: 'es',
      style: true,
    }],
  ],
};
```

#### extraPostCSSPlugins

配置额外的 postcss plugin。

* Type: `array`
* Default: `[]`

#### extraRollupPlugins

配置额外的 rollup plugin。

* Type: `array`
* Default: `[]`

```js
import url from 'rollup-plugin-url';

export default {
  extraRollupPlugins:[url()],
};
```

#### extraExternals

为 rollup 模式配置额外的 external，但不推荐这么做，external 可通过 dependencies 和 peerDependencies 的约定实现。

* Type: `string[]`
* Default: `[]`

#### externalsExclude

配置一些依赖不走 externals。

* Type: `string[]`
* Default: `[]`

比如 'foo' 走 externals，而 `foo/bar` 不走，可以这么配，

```js
export default {
  extraExternals: ['foo'],
  externalsExclude: ['foo/bar'],
}
```

#### include

配置 rollup-plugin-commonjs 的 [include][https://github.com/rollup/rollup-plugin-commonjs#usage]。

#### nodeResolveOpts

配置 [rollup-plugin-node-resolve](https://github.com/rollup/rollup-plugin-node-resolve) 参数。

#### disableTypeCheck

是否禁用类型检测。注意，该配置开启后 `babel` 模式下**将不会生成 TypeScript 类型定义**。

* Type: `boolean`
* Default: `false`

#### target

配置是 node 库还是 browser 库，只作用于语法层。

* Type: `"node" | "browser"`
* Default: `"browser"`

如果为 `node`，兼容到 node@6；如果为 `browser`，兼容到 `['last 2 versions', 'IE 10']`，所以肯定会是 es5 的语法。

#### browserFiles

target 为 `node` 时，配置例外文件走 `browser` target。

* Type: `[string]`
* Default: `[]`

注：

1. 所有 `.tsx` 和 `.jsx` 文件始终走 `browser` target。

#### nodeFiles

target 为 `browser` 时，配置例外文件走 `node` target。

* Type: `[string]`
* Default: `[]`

#### runtimeHelpers

是否把 helper 方法提取到 `@babel/runtime` 里。

* Type: `boolean`
* Default: `false`

注：

1. 推荐开启，能节约不少尺寸
2. 配置了 `runtimeHelpers`，一定要在 dependencies 里有 `@babel/runtime` 依赖
3. runtimeHelpers 只对 esm 有效，cjs 下无效，因为 cjs 已经不给浏览器用了，只在 ssr 时会用到，无需关心小的尺寸差异

#### replace

配置需要替换的内容，基于 [rollup-plugin-replace](https://github.com/rollup/rollup-plugin-replace)。

* Type: `Object`
* Default: `{}`

注：

1. babel 模式下暂不支持
2. 如果要输出字符串，值的部分用 `JSON.stringify()` 转下

比如：

```js
export default {
  replace: {
    VERSION: JSON.stringify(require('./package').version),
  },
}
```

#### inject

配置需要替换成依赖引用的全局变量 Map，基于 [rollup-plugin-inject](https://github.com/rollup/rollup-plugin-inject)。

* Type: `Object`
* Default: `{}`

比如：

```js
export default {
  inject: {
    'window.foo': 'foo',
  },
}
```

那么，

```js
console.log(window.foo);
```

会被编译成，

```js
import $inject_window_foo from 'foo';
console.log($inject_window_foo);
```

#### lessInRollupMode

在 rollup 模式下做 less 编译，支持配置 less 在编译过程中的 Options

* Type: `Object`
* Default: `{}`

可以配置 modifyVars 等， 详见 less 的 [Options 文档](http://lesscss.org/usage/#less-options)。

#### lessInBabelMode

在 babel 模式下做 less 编译，基于 [gulp-less](https://github.com/gulp-community/gulp-less)，默认不开启。

* Type: `Boolean` | `Object`
* Default: `false`

可以配置 paths 和 plugins，详见 gulp-less 的 Options 文档。

若配置 lessInBabelMode 为 [truthy](https://developer.mozilla.org/zh-CN/docs/Glossary/Truthy)，则会将

```js
import './index.less';
```

转换成

```js
import './index.css';
```

#### sassInRollupMode

在 rollup 模式下做 sass 编译，支持配置 sass 在编译过程中的 Options。

> 注：使用此功能需手动安装 node-sass 依赖。

* Type: `Object`
* Default: `{}`

详见 sass 的 [Options 文档](https://www.npmjs.com/package/node-sass#options)。

* Type: `Boolean` | `Object`
* Default: `false`

#### nodeVersion

指定 node 版本。

* Type: `Number`
* Default: `6`

比如：

```js
export default {
  target: 'node',
  nodeVersion: 8,
}
```

#### overridesByEntry

根据 entry 覆盖配置。

比如要为不同的 entry 配置不同的输出文件名，

```js
export default {
  entry: ['foo.js', 'bar.js'],
  overridesByEntry: {
    'foo.js': {
      file: 'bar',
    },
    'bar.js': {
      file: 'foo',
    },
  },
}
```

overridesByEntry 里的配置会和外面的配置进行 shadow 合并，比如：

```js
export default {
  umd: { globals: { jquery: 'window.jQuery' } }
  entry: ['foo.js', 'bar.js'],
  overridesByEntry: {
    'foo.js': {
      umd: { name: 'foo' },
    },
  },
}
```

则 `foo.js` 的 umd 配置为 `{ globals: { jquery: 'window.jQuery' }, name: 'foo' }`。

#### doc

透传配置给 [docz](https://www.docz.site/documentation/project-configuration)，可以有 `title`、`theme`、`themeConfig` 等。

比如要切换默认主题为 dark 模式：

```js
export default {
  doc: { themeConfig: { mode: 'dark' } },
}
```

#### doc.htmlContext

此配置在 docz 中没有标明，但是却是支持的，可用于扩展 html 模板。

```js
export default {
  doc: {
    htmlContext: {
      head: {
        favicon: '',
        meta: [],
        links: [
          { rel: 'stylesheet', href: 'foo.css' },
        ],
        scripts: [
          { src: 'bar.js' },
        ],
      },
      body: {
        scripts: [
          { src: 'hoo.js' },
        ],
      },
    },
  }
};
```

### pkgFilter

在 lerna 构建中，有需要对包进行过滤的需求

可配置项如下:

```ts
{
  /** 
   * 指定包含的包 
   */
  include?: string[];
  /** 
   * 指定排除的包 
   */
  exclude?: string[];
  /**
   * 是否跳过私有的包 package.json private
   * @default false
   */
  skipPrivate?: boolean;
}
```

`pkgFilter` 允许自定义排除/包含部分包，只对过滤后的包进行构建

例如: 存在  `@umi/util-1`、`@umi/util-2`、`@umi/core`、`@umi/test`(private) 多个包

```ts
// 只构建 `@umi/util-1`、`@umi/util-2`
export default {
  pkgFilter: {
    include: ['@umi/util-*']
  }
}

// 只构建 `@umi/util-1`、`@umi/core`、`@umi/test`
export default {
  pkgFilter: {
    exclude: ['@umi/util-2']
  }
}

// 只构建 `@umi/util-1`、`@umi/util-2`、`@umi/core`
export default {
  pkgFilter: {
    skipPrivate: true
  }
}
```

### pkgs

**已提供根据依赖自动排序的功能，除非有特殊需求定制构建顺序的，此配置项可忽略**

在 lerna 构建中，有可能出现组件间有构建先后的需求，比如在有两个包 `packages/father-a` 和 `packages/father-util`，在 `father-a` 中对 `father-util` 有依赖，此时需要先构建 `father-util` 才能保证构建的正确性

`pkgs` 允许你自定义 packages 目录下的构建顺序，如以上场景对应的配置为

```js
export default {
  pkgs: [
    'father-util',
    'father-a',
  ],
}
```

## Bonus

一些小贴士：

1. 通常只要配置 `esm: "rollup"` 就够了
2. cjs 和 esm 支持 rollup 和 babel 两种打包方式，rollup 是跟进 entry 把项目依赖打包在一起输出一个文件，babel 是把 src 目录转化成 lib（cjs） 或 es（esm）
3. 如果要考虑 ssr，再配上 `cjs: "rollup"`
4. `package.json` 里配上 `sideEffects: false | string[]`，会让 webpack 的 [tree-shaking](https://webpack.js.org/guides/tree-shaking/) 更高效

### 关于 dependencies、peerDependencies 和 external

1. cjs 和 esm 格式打包方式选 rollup 时有个约定，dependencies 和 peerDependencies 里的内容会被 external
2. esm.mjs 和 umd 格式，只有 peerDependencies 会被 external
3. 打包方式 babel 时无需考虑 external，因为是文件到文件的编译，不处理文件合并

### 关于 babel 模式

babel 模式下一些文件不会被编译到 es 和 lib 下，包含：
* `__test__` 目录
* `fixtures` 目录
* `demos` 目录
* `mdx` 文件
* `md` 文件
* 测试文件，比如 `test.js`、`spec.js`、`e2e.js`，后缀还支持 `jsx`、`ts` 和 `tsx`

## 环境变量

### LERNA

`LERNA=none` 时强制不走 lerna 方式的构建。

### PACKAGE

lerna 模式下，指定 package 只构建一个，调试时用于提效。

```bash
# 只构建 packages/foo
$ PACKAGE=foo father build
```

## LICENSE

MIT
