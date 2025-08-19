# Development  

Once the build configuration is set up, you can start development.  

## Real-Time Compilation  

During development, real-time compilation is needed for debugging and verification:  

```bash
# Start real-time compilation
$ father dev
# Skip the initial full build and only perform incremental builds on file changes
$ father dev --incremental
```  

Whenever source files or configuration changes, the output will be incrementally compiled in real-time.  

## Debugging in a Project  

To test in another project, use `npm link` to link your project for debugging and verification:  

```bash
$ cd test-project
$ npm link /path/to/your-father-project .
```  

Once development and testing are complete, you can proceed with [publishing](./release.md) the NPM package.  