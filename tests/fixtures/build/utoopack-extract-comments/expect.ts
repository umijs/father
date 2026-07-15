export default (files: Record<string, string>) => {
  const filename = 'utoopack-extract-comments.min.js';

  expect(files[`umd/${filename}`]).toContain(
    `For license information please see ${filename}.LICENSE.txt`,
  );
  expect(files[`umd/${filename}.LICENSE.txt`]).toContain(
    '/*! Father license */',
  );
};
