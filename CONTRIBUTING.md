# Contribute

> Notice: `y` is the alias for `yarn`, `n` is the alias for `npm`.

## Set up

Install dev deps after git clone the repo.

```bash
$ y
```

Bootstrap every package with yarn. (Need to execute when new package is included)

```bash
$ y bootstrap
```

Link father globally.

```bash
$ cd packages/father
$ y link
```

## Common Tasks

Monitor file changes and transform with babel.

```bash
$ y build --watch
```

Run test.

```bash
# Including e2e test
$ y test

# Unit test only
$ y debug .test.(t|j)s

# Test specified file and watch
$ y debug father-build/src/build.test.ts -w
```

## Publish

Add tag for PRs, changelog is generated based on these tags.

* pr(bug)
* pr(enhancement)
* pr(chore)
* pr(dependency)

Generate changelog.

```bash
$ y changelog
```

Publish to npm.

```bash
# Can't use yarn for this command.
$ n run publish
```

Debug doc in local.

```bash
$ y doc:dev
```

Paste the previously generated changelog at [umijs/father#release](https://github.com/umijs/father/releases).
