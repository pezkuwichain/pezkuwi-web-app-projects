import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      ".expo-shared/**",
      "dist/**",
      "coverage/**",
      "jest.config.js",
      "jest.setup.js",
      "metro.config.js",
      "eslint.config.js",
    ],
  },
  // Config for React Native app files
  {
    files: ["src/**/*.{js,jsx,ts,tsx}", "App.tsx", "index.ts"],
    plugins: {
      react: pluginReact,
      "react-hooks": hooksPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
        __DEV__: "readonly",
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,

      // React
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/display-name": "off",

      // TypeScript
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Global recommended rules
  ...tseslint.configs.recommended
);
