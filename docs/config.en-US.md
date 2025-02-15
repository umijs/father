# Config

Father supports the following configuration options.

## General Configuration

### **alias**  
- **Type**: `Record<string, string>`  
- **Default**: `undefined`  
- Specifies aliases to be handled during source code compilation/transformation.  
- In **Bundle mode**, `.js` and `.d.ts` output files will automatically convert local path aliases to relative paths.

### **define**  
- **Type**: `Record<string, string>`  
- **Default**: `undefined`  
- Specifies variables to be replaced during compilation/transformation, similar to **Webpack DefinePlugin**.

### **extends**  
- **Type**: `string`  
- **Default**: `undefined`  
- Specifies the path to the parent configuration file.

### **extraBabelPlugins**  
- **Type**: `string[]`  
- **Default**: `undefined`  
- Specifies additional **Babel plugins** to be applied.

> **Note**: In **Bundless mode**, if the `transformer` is set to `esbuild` or `swc`, this configuration does not take effect.

### **extraBabelPresets**  
- **Type**: `string[]`  
- **Default**: `undefined`  
- Specifies additional **Babel presets** to be applied.

> **Note**: This is also **not effective in Bundless mode** if `transformer` is `esbuild` or `swc`.

### **platform**  
- **Type**: `"browser" | "node"`  
- **Default**: `<auto>`  
- Specifies the **target platform** for the build output.  
  - **esm & umd**: Default is `"browser"`.  
  - **cjs**: Default is `"node"`.  
  - If set to `"browser"`, output is compatible with **IE11**.  
  - If set to `"node"`, output is compatible with **Node.js v14**.

> **Note**:  
> - In **Bundless mode**, if `transformer` is `esbuild`, the **browser compatibility defaults to Chrome 51** instead of IE11.

### **sourcemap**  
- **Type**: `boolean`  
- **Default**: `false`  
- Enables **source maps** for JavaScript build output.

> **Note**: In **Bundless mode**, the `map` object’s `file` field is empty.

### **targets**  
- **Type**: `Record<string, number>`  
- **Default**: `<auto>`  
- Specifies the compatibility target for compiled output.

| Platform  | Transformer | Default Target |
|-----------|------------|----------------|
| browser   | babel      | `{ ie: 11 }`   |
| browser   | esbuild    | `{ chrome: 51 }` |
| browser   | swc        | `{ ie: 11 }`   |
| node      | babel      | `{ node: 14 }` |
| node      | esbuild    | `{ node: 14 }` |
| node      | swc        | `{ node: 14 }` |

---

## **Build Configuration**  

Father provides build configurations based on **output types**:  

- **Bundless mode** → **ESModule (esm), CommonJS (cjs)**  
- **Bundle mode** → **UMD, Prebundle**  

---

## **Bundless Mode (ESM & CJS)**  

### **esm / cjs**  
- **Type**: `object`  
- **Default**: `undefined`  
- Configures **source code transformation** into **ESModule** or **CommonJS** format.  
- Supports overriding **general configurations**.

### **input**  
- **Type**: `string`  
- **Default**: `"src"`  
- Specifies the **source directory** to transform.

### **output**  
- **Type**: `string`  
- **Default**: `<auto>`  
- Specifies the **output directory**.  
  - **ESM** → Default is `dist/esm`  
  - **CJS** → Default is `dist/cjs`

### **transformer**  
- **Type**: `"babel" | "esbuild" | "swc"`  
- **Default**: `<auto>`  
- Specifies the **compilation tool**:  
  - `"babel"` (default for browser)  
  - `"esbuild"` (default for node)  
  - `"swc"`

### **overrides**  
- **Type**: `object`  
- **Default**: `undefined`  
- Allows **subdirectory-specific configurations**.

Example:
```ts
export default {
  esm: {
    overrides: {
      'src/server': {
        platform: 'node', // Compile `server` folder with `node` target
      },
    },
  },
};
```

### **ignores**  
- **Type**: `string[]`  
- **Default**: `undefined`  
- Specifies **files to ignore** during transformation.  
- Supports **glob patterns**.

> **Note**: By default, **Markdown and test files are ignored**.

### **parallel**  
- **Type**: `boolean`  
- **Default**: `false`  
- Enables **parallel compilation**.

---

## **Bundle Mode (UMD & Prebundle)**  

### **umd**  
- **Type**: `object`  
- **Default**: `undefined`  
- Configures **source bundling** into **UMD format**.  
- Supports overriding **general configurations**.

### **name**  
- **Type**: `string`  
- **Default**: `undefined`  
- Specifies the **library name** in the UMD output.

Example:
```ts
export default {
  umd: {
    name: 'fatherDemo',
  },
};
```

### **extractCSS**  
- **Type**: `boolean`  
- **Default**: `true`  
- Extracts CSS into a **separate file**.

### **entry**  
- **Type**: `string | Record<string, Config>`  
- **Default**: `"src/index"`  
- Specifies the **entry file(s)** for bundling.  
- Supports **multiple entry points**.

Example:
```ts
export default {
  umd: {
    entry: {
      'src/browser': {},
      'src/server': { platform: 'node' },
    },
  },
};
```

### **output**  
- **Type**: `string | { path?: string; filename?: string }`  
- **Default**: `"dist/umd"`  
- Specifies **output directory and filename**.

### **externals**  
- **Type**: `Record<string, string>`  
- **Default**: `undefined`  
- Defines **external dependencies**.

### **chainWebpack**  
- **Type**: `function`  
- **Default**: `undefined`  
- Uses **webpack-chain** to customize **Webpack configuration**.

---

## **Prebundle Mode**  

Prebundling is used to **reduce install size and improve project stability**, especially for **Node.js tools and frameworks**.

### **output**  
- **Type**: `string`  
- **Default**: `"compiled"`  
- Specifies the **prebundle output directory**.

### **deps**  
- **Type**: `string[] | Record<string, { minify?: boolean; dts?: boolean }>`  
- **Default**: `undefined`  
- Defines **dependencies to prebundle**.

Example:
```ts
export default {
  prebundle: {
    deps: ['rimraf'],
    deps: {
      rimraf: { minify: false },
    },
  },
};
```

### **extraDtsDeps**  
- **Type**: `string[]`  
- **Default**: `undefined`  
- Specifies dependencies **only needing TypeScript declaration files (`.d.ts`)**.

---

## **Other Configurations**  

### **plugins**  
- **Type**: `string[]`  
- **Default**: `undefined`  
- Defines additional **Father plugins**.

Example:
```ts
// plugin.ts
import type { IApi } from 'father';

export default (api: IApi) => {
  api.modifyConfig((memo) => {
    return memo;
  });
};

// .fatherrc.ts
export default {
  plugins: ['./plugin.ts'],
};
```

### **presets**  
- **Type**: `string[]`  
- **Default**: `undefined`  
- Defines additional **Father plugin presets**.

Example:
```ts
export default (api: IApi) => ({
  presets: [require.resolve('./other-preset')],
  plugins: [require.resolve('./plugin-a'), require.resolve('./plugin-b')],
});
```
