import unusedImports from "eslint-plugin-unused-imports";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";

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
            parser: typescriptEslintParser, // Use the parser here
        },
        plugins: {
            "unused-imports": unusedImports,
            "@typescript-eslint": typescriptEslintPlugin,
        },
        rules: {
            "unused-imports/no-unused-imports": "error",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-module-boundary-types": "warn",
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
