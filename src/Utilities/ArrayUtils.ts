const getArrayFields = <T>(array: Array<T>): Array<string> => {
    const fields = array.reduce((acc, obj) => {
        return new Set([...acc, ...Object.keys(obj as {})]);
    }, new Set<string>());

    return Array.from(fields);
};

export { getArrayFields };
