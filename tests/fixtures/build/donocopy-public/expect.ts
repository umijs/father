export default (files: Record<string, string>) => {
  expect(/Hello/.test(files['umd/index.min.js'])).toBeTruthy();

  // build umd do no copy public
  expect(files['umd/some.txt']).toBe(undefined);
};
