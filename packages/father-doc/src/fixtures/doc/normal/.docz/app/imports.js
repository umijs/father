export const imports = {
  'README.mdx': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "readme" */ 'README.mdx'
    ),
  'button/index.mdx': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "button-index" */ 'button/index.mdx'
    ),
}
