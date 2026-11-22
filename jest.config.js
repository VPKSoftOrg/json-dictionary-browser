/** @type {import("jest").Config} */
const config = {
    testEnvironment: "jsdom",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.ts", "**/*.test.tsx"],
    setupFiles: ["<rootDir>/src/Tests/Setup.ts"],
    // SWC only strips the types; `tsc -b` type checks the tests through tsconfig.test.json
    transform: {
        "^.+\.tsx?$": [
            "@swc/jest",
            {
                jsc: {
                    parser: { syntax: "typescript", tsx: true },
                    transform: { react: { runtime: "automatic" } },
                },
                module: { type: "commonjs" },
            },
        ],
    },
    moduleNameMapper: {
        "\.(css|less|scss)$": "<rootDir>/src/Tests/Mocks/StyleMock.ts",
        "\.(svg|png|jpg|jpeg|gif|ico)$": "<rootDir>/src/Tests/Mocks/FileMock.ts",
        "^virtual:pwa-register/react$": "<rootDir>/src/Tests/Mocks/PwaRegisterMock.ts",
    },
    globals: {
        __APP_VERSION__: "0.0.0-test",
        __APP_NAME__: "JSON Dictionary Browser",
    },
};

export default config;
