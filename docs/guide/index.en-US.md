# Guide

## Introduction

Father is an NPM package development tool that helps developers efficiently and reliably develop NPM packages, generate build artifacts, and publish them. It offers the following key features:  

- ⚔️ **Dual-mode Build**: Supports both Bundless and Bundle build modes—ESModule and CommonJS outputs use Bundless mode, while UMD outputs use Bundle mode.  
- 🎛 **Multiple Build Engines**: Bundle mode uses Webpack as the build engine, while Bundless mode supports esbuild, Babel, and SWC, allowing flexible configuration switching.  
- 🔖 **Type Generation**: Supports generating `.d.ts` type definitions for TypeScript modules, whether for source code builds or dependency pre-bundling.  
- 🚀 **Persistent Caching**: All output types support persistent caching, enabling faster incremental builds.  
- 🩺 **Project Inspection**: Checks for common pitfalls in NPM package development to ensure more stable releases.  - 
- 🏗 **Micro Generators**: Adds commonly used engineering capabilities to projects, such as setting up Jest for testing.  
- 📦 **Dependency Pre-Bundling**: Provides out-of-the-box dependency pre-bundling to improve the stability of Node.js frameworks/libraries and prevent issues caused by upstream dependency updates (experimental).  

---

#### Compatibility  

- Father requires Node.js v14 or later to run. Please ensure that you have Node.js v14+ installed before using it.  
- The default Node.js output from Father is compatible with Node.js v14+.  
- Browser output is compatible with ES5 (IE11) by default.  

---

#### Quick Start  

Use `create-father` to quickly create a new Father project:  

```sh
npx create-father my-father-project
```  

This template includes only the basic configuration. For additional configuration options, refer to the **Configuration** documentation.  

To build the project, run:  

```sh
npx father build
```  

After the build completes, check the `dist` folder to see the generated output. Congratulations! 🎉 You've successfully built your first Father project!  

---

#### Next Steps 

Explore more features of Father:  
- Bundless vs. Bundle build modes  
- Building ESModule & CommonJS outputs 
- Building UMD outputs 
- Dependency pre-bundling  
- Running project inspections  
- Development guide
- Publishing guide
