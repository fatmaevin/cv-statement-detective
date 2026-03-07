import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "frontend", 
  build: {
    outDir: "../dist", 
  },
  plugins: [
    tailwindcss(), 
  ],
});
