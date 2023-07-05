export default (files: Record<string, string>) => {
  // check url/index.js is exists
  expect(files['url/index.js']).not.toBeUndefined();
  expect(files['url/index.d.ts']).toBeUndefined();
};
