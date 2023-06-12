export default (files: Record<string, string>) => {
  expect(Object.keys(files)).toMatchInlineSnapshot(`
    Array [
      "a/index.d.ts",
      "a/index.js",
      "a/package.json",
      "a-alias/index.d.ts",
      "a-alias/index.js",
      "a-alias/package.json",
    ]
  `);
};
