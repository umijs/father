export default (files: Record<string, string>) => {
  // expect export namespace as ESModule
  expect(files['hello/index.d.ts']).toContain('export default Hello');

  // expect re-export types for the exported namespace Hello
  expect(files['hello/index.d.ts']).toContain('type A = Hello.A');
  expect(files['hello/index.d.ts']).toContain('type B = Hello.B');
  expect(files['hello/index.d.ts']).toContain('type C = Hello.C');
  expect(files['hello/index.d.ts']).toContain('type D = Hello.D');
  expect(files['hello/index.d.ts']).toContain('type E = Hello.E');
};
