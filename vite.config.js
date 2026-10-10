import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  
  const basePath = env.VITE_BASE_PATH || "/";
  
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    
    // GitHub Pages base path
    // Example: /IDP/ for https://username.github.io/IDP/
    // Use / for a custom domain or username.github.io root site
    base: basePath.endsWith("/") ? basePath : `${basePath}/`,
    
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
