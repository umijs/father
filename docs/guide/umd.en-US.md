# Building UMD Bundles

## When to Use UMD Output

You should generate a UMD (Universal Module Definition) bundle only if one of the following conditions applies:

1. Your users need to treat the package as an external dependency  
   - They might want to include it directly in an HTML file using a `<script>` tag from a CDN (e.g., React or Ant Design).

2. Your package needs to generate precompiled stylesheets 
   - For example, if your package includes Less files that need to be compiled into CSS with specific theme variables (common in UI libraries like Ant Design that support theme customization).

## How to Build a UMD Bundle

Simply enable the `umd` option in the configuration file and run `father build`:

```js
// .fatherrc.js
export default {
  // Default settings when UMD mode is enabled (customize as needed)
  umd: {
    entry: 'src/index', // Default entry file for the build
  },
};
```

For additional options, refer to the [configuration documentation](../config.md).

In Father, UMD output is built using the Bundle mode.  
For more details, see: [Build Modes - Bundle](./build-mode.md#bundle).