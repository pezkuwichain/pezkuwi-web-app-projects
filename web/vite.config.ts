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
  define: {
    'global': 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@pezkuwi/i18n": path.resolve(__dirname, "../shared/i18n"),
      "@pezkuwi/lib": path.resolve(__dirname, "../shared/lib"),
      "@pezkuwi/utils": path.resolve(__dirname, "../shared/utils"),
      "@pezkuwi/theme": path.resolve(__dirname, "../shared/theme"),
      "@pezkuwi/types": path.resolve(__dirname, "../shared/types"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  assetsInclude: ['**/*.json'],
}));