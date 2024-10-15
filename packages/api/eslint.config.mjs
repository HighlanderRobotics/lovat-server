import unusedImports from "eslint-plugin-unused-imports";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // js.configs.recommended,
  ...tseslint.configs.stylistic,

  {
    files: ["**/*.js", "**/*.ts"],
    ignorePatterns: ["sst-env.d.ts"],
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
      "@typescript-eslint/prefer-for-of": "warn",
    },
  },
];
