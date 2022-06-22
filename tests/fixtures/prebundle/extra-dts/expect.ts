export default (files: Record<string, string>) => {
  // only output d.ts
  expect(files['minimatch/index.d.ts']).not.toBeUndefined();

  // no other dist files
  expect(files['minimatch/index.js']).toBeUndefined();
  expect(files['minimatch/package.json']).toBeUndefined();
};
