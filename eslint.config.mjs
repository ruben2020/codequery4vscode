import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default defineConfig([
    {
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 6,
            sourceType: "module",
        },

        rules: {
            curly: "warn",
            eqeqeq: "warn",
            "no-throw-literal": "warn",
            semi: "off",
        }
    },
    {
        ignores: [
            "**/node_modules/**",
            "**/out/**",
            "**/dist/**",
            "**/*.d.ts",
            ".vscode-test.mjs",
            "**/.vscode-test/**" // Added a wildcard prefix for safety
        ]
    }
]);
