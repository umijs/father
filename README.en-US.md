# father

[![version](https://badgen.net/npm/v/father)](https://www.npmjs.com/package/father) [![codecov](https://codecov.io/gh/umijs/father/branch/master/graph/badge.svg)](https://codecov.io/gh/umijs/father) [![GitHub Actions status](https://github.com/umijs/father/workflows/CI/badge.svg)](https://github.com/umijs/father)

father is an NPM package development tool that helps developers efficiently and reliably develop NPM packages, generate build artifacts, and publish them. It offers the following key features:  

- ⚔️ **Dual-mode Build**: Supports both Bundless and Bundle build modes—ESModule and CommonJS outputs use Bundless mode, while UMD outputs use Bundle mode.  
- 🎛 **Multiple Build Engines**: Bundle mode uses Webpack as the build engine, while Bundless mode supports esbuild, Babel, and SWC, allowing flexible configuration switching.  
- 🔖 **Type Generation**: Supports generating `.d.ts` type definitions for TypeScript modules, whether for source code builds or dependency pre-bundling.  
- 🚀 **Persistent Caching**: All output types support persistent caching, enabling faster incremental builds.  
- 🩺 **Project Inspection**: Checks for common pitfalls in NPM package development to ensure more stable releases.  
- 🏗 **Micro Generators**: Adds commonly used engineering capabilities to projects, such as setting up Jest for testing.  
- 📦 **Dependency Pre-Bundling**: Provides out-of-the-box dependency pre-bundling to improve the stability of Node.js frameworks/libraries and prevent issues caused by upstream dependency updates (experimental).  

Visit the [Guide](./docs/guide/index.md) and [Configuration](./docs/config.md) sections for more details.  

If you're looking for documentation for older versions of father/father-build, switch to the [2.x branch](https://github.com/umijs/father/tree/2.x). It is recommended to check the [Upgrade Guide](./docs/guide/upgrading.md) to migrate to Father 4 for an improved development experience.  

## Contribution Guide  
Refer to the [CONTRIBUTING](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
