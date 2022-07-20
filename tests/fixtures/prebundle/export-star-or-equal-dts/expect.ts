export default (files: Record<string, string>) => {
  // expect export namespace as ESModule
  expect(files['equal/index.d.ts']).toContain('export default Equal');

  // expect re-export types for the exported namespace Equal
  expect(files['equal/index.d.ts']).toContain('type A = Equal.A');
  expect(files['equal/index.d.ts']).toContain('type B = Equal.B');
  expect(files['equal/index.d.ts']).toContain('type C = Equal.C');
  expect(files['equal/index.d.ts']).toContain('type D = Equal.D');
  expect(files['equal/index.d.ts']).toContain('type E = Equal.E');

  // expect keep export * from ambient module
  expect(files['star-ambient-module/index.d.ts']).toContain(
    'export * from "fs"',
  );
};
