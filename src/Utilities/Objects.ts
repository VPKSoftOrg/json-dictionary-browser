/**
 * Omits specified fields from an object.
 * @template T - The type of the object.
 * @param {T} value - The object from which fields will be omitted.
 * @param {Array<keyof T>} fields - The fields to omit from the object.
 * @returns {Partial<T>} A new object with the specified fields omitted.
 */
const omitFields = <T>(value: T, fields: Array<keyof T>) => {
    let newValue = { ...value };
    for (const field of fields) {
        // Set the field to undefined first as it may be a function or something
        // else witch doesn't allow deletion
        newValue = {
            ...newValue,
            [field]: undefined,
        };

        delete newValue[field];
    }
    return newValue;
};

export { omitFields };
