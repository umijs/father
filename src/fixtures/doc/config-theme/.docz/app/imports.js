export const imports = {
  'README.mdx': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "readme" */ 'README.mdx'
    ),
}
