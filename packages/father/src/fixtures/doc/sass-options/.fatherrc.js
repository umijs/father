
export default {
  esm: 'rollup',
  sassInRollupMode: {
    functions: {
      '$primary-color': function(from, to) {
        require('node-sass').types.Color
        return new Color(255, 0, 0);
      }
    }
  }
}
