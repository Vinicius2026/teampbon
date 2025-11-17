import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? './' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2017', // Compatível com iOS Safari sem usar eval
    rollupOptions: {
      output: {
        manualChunks: undefined,
        format: 'es', // ES Modules ao invés de IIFE (evita eval)
        // Evita uso de eval/Function no bundle
        generatedCode: {
          constBindings: true,
          objectShorthand: true,
        },
      },
    },
    // Garante que não use eval
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
