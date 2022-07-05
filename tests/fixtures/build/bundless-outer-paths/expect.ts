export default (files: Record<string, string>) => {
  // expect keep original import for tsconfig paths which out of cwd
  expect(files['esm/index.d.ts']).toContain("from '@bundless-overrides'");
  expect(files['esm/index.js']).toContain("from '@bundless-overrides'");
};
