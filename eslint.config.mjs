import { ESLint } from "eslint";
import unusedImports from "eslint-plugin-unused-imports";
import { rules as eslintRecommendedRules } from "eslint/conf/eslint-recommended";
import { rules as typescriptRecommendedRules } from "@typescript-eslint/eslint-plugin";
import { rules as importRecommendedRules } from "eslint-plugin-import";
import { rules as nodeRecommendedRules } from "eslint-plugin-node";
import { rules as promiseRecommendedRules } from "eslint-plugin-promise";

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
        rules: {
            // Include ESLint recommended rules
            ...eslintRecommendedRules,

            // Include TypeScript recommended rules
            ...typescriptRecommendedRules,

            // Include import plugin recommended rules
            ...importRecommendedRules,

            // Include Node.js plugin recommended rules
            ...nodeRecommendedRules,

            // Include Promise plugin recommended rules
            ...promiseRecommendedRules,

            // Custom rules
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
            "import/no-unresolved": "error",        // Ensure imports point to a valid file/module
            "node/no-missing-import": "error",      // Disallow import of missing files
            "promise/always-return": "error",       // Ensure promises return a value
            "promise/no-nesting": "warn",           // Avoid nested promises
            "@typescript-eslint/no-explicit-any": "warn",  // Avoid using 'any' type in TypeScript
            "@typescript-eslint/explicit-module-boundary-types": "warn",  // Require explicit return types on functions and class methods
        },
    },
];
