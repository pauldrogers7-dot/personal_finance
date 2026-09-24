import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
// Set VITE_BASE_PATH env var (e.g. /repo-name/) for GitHub Pages deployments
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react() as PluginOption, tailwindcss() as PluginOption],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
  },
  build: {
    // Disable type checking during build for faster builds
    // Type checking should be done separately via tsc --noEmit
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress type-related warnings during build
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      }
    }
  },
  esbuild: {
    // Disable type checking in esbuild
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
