import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { config } from "dotenv";

// Load environment variables
config();

export default defineConfig({
  plugins: [sveltekit()],
  // Performance optimizations
  build: {
    target: "esnext", // Target modern browsers for better performance
    minify: "esbuild", // Use esbuild for faster minification
  },
  // Development optimizations
  server: {
    port: 5173, // Use port 5173 for development
    fs: {
      allow: [".."], // Allow access to parent directory for better development
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "@auth/core",
      "@auth/sveltekit",
      "@auth/drizzle-adapter",
      "drizzle-orm",
    ],
  },
});
