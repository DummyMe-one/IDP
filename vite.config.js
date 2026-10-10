import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // GitHub Pages project sites must use the repository path as the base.
  const basePath = env.VITE_BASE_PATH || "/IDP/";

  return {
    base: basePath.endsWith("/") ? basePath : `${basePath}/`,
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      hmr: {
        port: 3000,
      },
    },

    build: {
      outDir: "dist",
      sourcemap: false,
      emptyOutDir: true,
    },
  };
});
