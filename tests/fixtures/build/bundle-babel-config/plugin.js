module.exports = function () {
  return {
    visitor: {
      Literal(path) {
        path.node.value = 'replacedName';
      },
    },
  };
};
