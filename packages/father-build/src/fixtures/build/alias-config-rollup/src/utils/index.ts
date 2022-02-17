export const serializationArrayByKey = (list: any[], key: string) => {
  if (!list) {
    return null;
  }

  return list.reduce((prev, current) => {
    const currentId = current[key];
      return {
        ...prev,
        [currentId]: (prev[currentId] || []).concat([current]),
      };
  }, {});
};
