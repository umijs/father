{
  "name": "{{{ name }}}",
  "version": "0.0.1",
  "description": "{{{ description }}}",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "dev": "father dev",
    "build": "father build",
    "build:deps": "father prebundle",
    "prepublishOnly": "npm run build"
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
