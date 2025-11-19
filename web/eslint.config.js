import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import refreshPlugin from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "eslint.config.js", "postcss.config.js"],
  },
  // Config for Node files
  {
    files: ["vite.config.ts", "tailwind.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: "tsconfig.node.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Node-specific rules can go here
    },
  },
  // Config for React app files
  {
    files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": hooksPlugin,
      "react-refresh": refreshPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: "tsconfig.app.json", // Use the app-specific tsconfig
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      "react-refresh/only-export-components": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
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