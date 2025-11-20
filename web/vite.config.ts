/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
  server: {
    host: "::",
    port: 8082,
    strictPort: false, // Allow automatic port selection if 8082 is busy
    hmr: {
      protocol: 'ws',
      host: 'localhost',
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
      "@pezkuwi/components": path.resolve(__dirname, "../shared/components"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
    dedupe: ['react', 'lucide-react', 'sonner', '@polkadot/util-crypto', '@polkadot/util', '@polkadot/api', '@polkadot/extension-dapp', '@polkadot/keyring'],
  },
  optimizeDeps: {
    include: ['@polkadot/util-crypto', '@polkadot/util', '@polkadot/api', '@polkadot/extension-dapp', '@polkadot/keyring'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'polkadot': ['@polkadot/api', '@polkadot/extension-dapp', '@polkadot/keyring', '@polkadot/util', '@polkadot/util-crypto'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  assetsInclude: ['**/*.json'],
}));