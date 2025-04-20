/**
 * Converts the first character of a string to uppercase,
 * leaving the rest of the string unchanged.
 *
 * @param str - The input string to be converted.
 * @returns A new string with the first character in uppercase.
 */

const pascalCase = (str: string): string => {
    return str[0].toUpperCase() + str.slice(1);
};

export { pascalCase };
