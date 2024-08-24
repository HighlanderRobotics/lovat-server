import unusedImports from "eslint-plugin-unused-imports";

export default [
    {
        files: ["**/*.js", "**/*.ts"], 
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
        extends: [
            "eslint:recommended",                // ESLint recommended rules
            "plugin:@typescript-eslint/recommended",  // Recommended TypeScript rules
            "plugin:import/recommended",          // Recommended import rules
            "plugin:node/recommended",            // Recommended Node.js rules
            "plugin:promise/recommended"          // Recommended Promise rules
        ],
        rules: {
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "off",
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
