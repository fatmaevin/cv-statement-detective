import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "index.html",
        createGame: "pages/create-game.html",
        join: "pages/join-game.html",
        waitingRoom: "pages/waiting-room.html",
        waitingResult: "pages/waiting-result.html",
        game: "pages/game.html",
        result: "pages/result.html",
      },
    },
  },
  plugins: [tailwindcss()],
});
