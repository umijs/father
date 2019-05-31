export const imports = {
  'button/index.mdx': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "button-index" */ 'button/index.mdx'
    ),
}
