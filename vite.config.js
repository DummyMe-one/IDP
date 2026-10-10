import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), "");

return {
plugins: [react(), tailwindcss()],

```
// GitHub Pages repository path, configured through VITE_BASE_PATH
base: env.VITE_BASE_PATH || "/",

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
},
```

};
});
