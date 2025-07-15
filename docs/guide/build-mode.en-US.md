# Build Modes  

## Bundless  

Bundless is a file-to-file build mode that does not process dependencies but instead compiles source files in parallel. Some popular community tools like [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html), [unbuild](https://github.com/unjs/unbuild), and the older Babel mode of father use this approach for building.  

In father 4, both ESModule and CommonJS outputs use the Bundless build mode. Let's take a look at how father works in this mode.  

Given the following source structure:  

```bash
.
└── src
    ├── index.less
    ├── index.tsx
    └── util.js
```  

With the following build configuration:  

```js
export default {
  esm: { output: 'dist' },
  // or
  cjs: { output: 'dist' },
};
```  

father will generate the following output:  

```bash
.
└── dist
    ├── index.d.ts
    ├── index.js
    ├── index.less
    └── util.js
```  

### How Bundless Works  

In Bundless mode, father processes the source files as follows:  

1. TypeScript files are compiled into JavaScript files, with corresponding `.d.ts` type definitions.  
2. JavaScript files are compiled into JavaScript with compatibility adjustments.  
3. Other files (such as stylesheets) are copied directly without modification.  

### When to Choose Bundless  

Bundless builds allow selective imports and provide better debugging capabilities. For most projects, Bundless is the preferred choice, which is why it is widely adopted in the community.  

For details on choosing between ESModule and CommonJS outputs, refer to the [ESModule vs CommonJS](./esm-cjs.md#how-to-choose) guide.  

---

## Bundle  

Bundle mode packages the source files by starting from an entry file, recursively resolving dependencies, and merging everything into a final build output. Tools like [Webpack](https://webpack.js.org), [Rollup](https://rollupjs.org/guide/en/), and the older Rollup mode of father follow this approach.  

In **father 4**, the Bundle build mode is only used for UMD outputs. Let's see how it works.   

Given the following source structure:  

```bash
.
└── src
    ├── index.less
    └── index.tsx  # Imports index.less
```  

With the following build configuration:  

```ts
export default {
  umd: { output: 'dist' },
};
```  

father will generate:  

```bash
.
└── dist
    ├── index.min.js
    └── index.min.css
```  

### How Bundle Works  

In Bundle mode, father processes the source files by:  

- Bundling all dependencies into a single output file.  
- Generating minified JavaScript and CSS assets for optimized delivery.  

### When to Choose Bundle  

Bundle mode produces self-contained outputs. Since father only uses Bundle mode for UMD builds, choosing UMD automatically means using the Bundle mode.  

For guidance on when to choose UMD outputs, refer to the [UMD Build Guide](./umd.md#how-to-choose).  