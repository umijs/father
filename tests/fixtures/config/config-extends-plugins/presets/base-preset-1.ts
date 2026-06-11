export default () => {
  return {
    plugins: [require.resolve('../plugins/plugin-from-preset')],
  };
};
