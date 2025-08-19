# Building ESModule and CommonJS Outputs  

> In the Father project, ESModule and CommonJS output builds follow a similar process, so they are covered together in this chapter.  

## How to Choose  

ESModule is the module standard for JavaScript, while CommonJS is used by Node.js. To determine which output format your project needs, consider the usage scenario:  

| Output Type / Runtime | Browser | Node.js  | Both    |
| ---------------------- | ------- | -------- | ------- |
| ESModule              | ✅ Recommended | Not Recommended Yet | ✅ Recommended |
| CommonJS              | Not Necessary  | ✅ Recommended  | ✅ Recommended |  

Additional Notes  

1. The push for Pure ESM in the Node.js community still faces [some challenges](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). For broader compatibility, it is still recommended to produce CommonJS outputs for Node.js projects. In the future, Father will introduce a compatibility solution for generating both ESModule and CommonJS outputs.  
2. For browser environments, CommonJS output is unnecessary since all modern module bundlers can handle ESModules. With the rise of tools like Vite that support native ESModules, using ESModule is the best future-proof approach.  
3. Both means the output is intended for use in both browser and Node.js environments, such as `react-dom` and `umi`.  

## How to Build  

Use the `esm` and `cjs` configuration options, then run `father build` to generate ESModule and CommonJS outputs:  

```js
// .fatherrc.js
export default {
  // Default values for the `esm` config (only override if needed)
  esm: {
    input: 'src', // Default compilation directory
    platform: 'browser', // Outputs for browser environments by default
    transformer: 'babel', // Uses Babel for better compatibility
  },
  // Default values for the `cjs` config (only override if needed)
  cjs: {
    input: 'src', // Default compilation directory
    platform: 'node', // Outputs for Node.js environments by default
    transformer: 'esbuild', // Uses esbuild for faster build speeds
  },
};
```  

For more configuration options, refer to the [Configuration Guide](../config.md).  

In the Father project, both ESModule and CommonJS outputs are built using the Bundless mode. For details on Bundless mode, see [Build Modes - Bundless](./build-mode.md#bundless).  