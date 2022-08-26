{
  "name": "{{{ name }}}",
  "version": "0.0.1",
  "description": "{{{ description }}}",
  {{#isBothNodeBrowser}}"main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",{{/isBothNodeBrowser}}{{#isNode}}"main": "dist/cjs/index.js",
  "types": "dist/cjs/index.d.ts",{{/isNode}}{{#isBrowser}}"module": "dist/esm/index.js",
  "types": "dist/esm/index.d.ts",{{/isBrowser}}
  "scripts": {
    "dev": "father dev",
    "build": "father build",
    "build:deps": "father prebundle",
    "prepublishOnly": "father doctor && npm run build"
  },
  "keywords": [],
  "authors": [{{#author}}
    "{{{ author }}}"
  {{/author}}],
  "license": "MIT",
  "files": [
    "dist",
    "compiled"
  ],
  "publishConfig": {
    "access": "public"
  },
  "devDependencies": {
    "father": "{{{ version }}}"
  }
}
