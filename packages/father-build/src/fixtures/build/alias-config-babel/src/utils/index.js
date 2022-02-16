export const serializationArrayByKey = (list, key) => {
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
