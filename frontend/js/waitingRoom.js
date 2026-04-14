import { appConfig } from "./config";
import { showAlert } from "./alert";

showAlert({
    message: "⚠️ Leaving this page may disconnect you from the game",
    type: "info",
    blocking: true,
    
  });

const playersList = document.getElementById("playersList");
const playerCount = document.getElementById("playerCount");

// Get game_id from URL
const params = new URLSearchParams(window.location.search);
const gameId = params.get("game_id");

const API_BASE = appConfig.apiBaseUrl;

// Warn before leaving
window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "";
 });

// Load players
async function loadPlayers() {
  try {

    const response = await fetch(`${API_BASE}/games/${gameId}/players`);

    if (!response.ok) {
      throw new Error("Failed to fetch players");
    }

    const players = await response.json();

    playersList.innerHTML = "";
    playerCount.textContent = "players joined";

    players.forEach((player) => {
      const li = document.createElement("li");
      li.className = "player-item";
      li.textContent = player.name;
      playersList.appendChild(li);
    });

    playerCount.textContent = `${players.length} players joined`;
  } catch (error) {
    console.error("Error loading players:", error);
  }
}

async function checkGameStatus() {
  try {
    const response = await fetch(
      `${API_BASE}/debug/game-status/${gameId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch game status");
    }

    const game = await response.json();
    console.log("Game status:", game);

    if (game.status === "in_progress") {
      window.location.href = `/pages/game.html?game_id=${gameId}`;
    }

  } catch (error) {
    console.error("Error checking game status:", error);
  }
}

// Run every 3 seconds
setInterval(() => {
  loadPlayers();
  checkGameStatus();
}, appConfig.timer.gamePollingInterval);

// Initial load
loadPlayers();
checkGameStatus();
