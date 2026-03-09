import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: "frontend/index.html",
        createGame: "frontend/pages/create-game.html",
        join: "frontend/pages/join-game.html",
        waitingRoom: "frontend/pages/waiting-room.html",
        waitingResult: "frontend/pages/waiting-result.html",
        game: "frontend/pages/game.html",
        result: "frontend/pages/result.html",
      },
    },
  },
  plugins: [tailwindcss()],
});
