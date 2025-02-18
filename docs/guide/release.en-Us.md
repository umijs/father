# Publishing

A standard NPM package can typically be published in just four steps. For monorepo projects, please refer to the specific publishing practices of your monorepo setup.

## Prerequisites

1. Run `npm whoami` to check if you are logged in. If not, log in using `npm login`.
2. Verify that the package name and publishConfig fields in `package.json` match your expectations.

## Updating the Version Number

Use the `npm version` command to increment the version number, for example:

```bash
# Publish a patch version
$ npm version patch -m "build: release %s"
```

This command will automatically create a Git tag, commit the change, and update the version in `package.json`.  
For more details, refer to the official NPM documentation: [npm version command](https://docs.npmjs.com/cli/v8/commands/npm-version).

## Build and Publish

Father 4's CLI automatically includes the [Project Health Check](./doctor.md) and build command in the `prepublishOnly` script:

```diff
  "scripts": {
    ...
+   "prepublishOnly": "father doctor && npm run build"
  },
```

This means you only need to run the publish command:

```bash
# NPM will automatically execute the prepublishOnly script before publishing
$ npm publish
```

## Post-Publish Tasks

1. **Functionality Validation:** Use a test project to install the newly published NPM package and verify that it works as expected.
2. **Update Release Notes:**  
   - Document the changes in the GitHub Releases page.  
   - Alternatively, add them to `CHANGELOG.md` before publishing.  
   - (Father will soon support automated changelog generation—stay tuned!)