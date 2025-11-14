import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 8081,
    },
    watch: {
      usePolling: true,
    },
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@pezkuwi/i18n": path.resolve(__dirname, "../shared/i18n"),
    },
  },
  json: {
    stringify: true,
  },
  assetsInclude: ['**/*.json'],
}));