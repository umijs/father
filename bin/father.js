#!/usr/bin/env node

require('../dist/cli/cli')
  .run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
