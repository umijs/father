export default (files: Record<string, string>) => {
  // esm use automatic jsx runtime
  expect(files['esm/index.js']).toContain('react/jsx-runtime');

  // umd use automatic jsx runtime, (0,t.jsx)(t.Fragment, ...)
  expect(
    /(\w)+\.jsx\)\(\1\.Fragment/.test(files['umd/index.min.js']),
  ).toBeTruthy();
};
