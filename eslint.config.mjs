import unusedImports from "eslint-plugin-unused-imports";

export default [
    {
        files: ["**/*.js"], 
        languageOptions: {
            ecmaVersion: 2024, 
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
            },
        },
        plugins: {
            "unused-imports": unusedImports,
        },
        rules: {
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
];
