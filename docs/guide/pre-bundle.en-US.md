# Dependency Pre-Bundling (Experimental)

> Note: Dependency pre-bundling is **only applicable to Node.js projects** and should not be used for browser-based projects.

Dependency pre-bundling refers to compiling a project's dependencies, including their transitive dependencies, in advance as part of the project’s build output. The project's source code is then modified to import dependencies directly from the pre-bundled output.

This approach has gained popularity in the Node.js community in recent years and provides several key benefits:

1. **Smaller installation size and faster install speed for published NPM packages.**  
   An NPM package's dependency tree is often highly complex—while we may only depend on package A, the installation process might pull in an entire forest of dependencies, many of which are unnecessary. Pre-bundling consolidates these dependencies into a single file, reducing the overall package size and installation time.

2. **Improved project stability.**  
   Many developers have encountered situations where "everything worked fine yesterday, but it's broken today." Even if upstream dependencies are carefully updated, they cannot guarantee compatibility across all use cases. Some dependencies might not even follow semantic versioning (semver). Pre-bundling allows us to take control of dependency updates—only updating them when we choose to re-bundle—significantly improving project stability.

3. **Zero warnings when installing the published NPM package.**  
   The NPM installation process performs `peerDependencies` validation, which can generate many warnings. Since pre-bundled dependencies are included in the package, users will no longer see these warnings. However, as package maintainers, we can still review them during development.

Despite its advantages, dependency pre-bundling can be complex. Challenges include handling `dynamic require/import` statements and accessing adjacent files in the bundled output. These issues can lead to pre-bundling failures or unusable results.

Father has implemented extensive handling for these cases, but pre-bundling remains an **experimental feature**. Use it with caution, and report any issues in the [GitHub issue tracker](https://github.com/umijs/father-next/issues/28) to help improve the tool.

For further reading, check out this related [article by YK](https://mp.weixin.qq.com/s/KbmpzvoB1yJlNDEO1p_fJQ) on dependency locking.

## How to Build

Simply enable the `prebundle` option and run `father prebundle` to generate the pre-bundled output:

```js
// .fatherrc.js
export default {
  prebundle: {
    deps: ['pkg-a', 'pkg-b'], // Dependencies to pre-bundle (must be installed in `devDependencies`)
    output: 'compiled', // Default output directory (customize only if necessary)
  },
};
```

For more configuration options, refer to the [Configuration Guide](../config.md).