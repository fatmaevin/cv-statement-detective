const playersList = document.getElementById("playersList");
const playerCount = document.getElementById("playerCount");
const startGameBtn = document.getElementById("startGameBtn");

// Get game_id from URL
const params = new URLSearchParams(window.location.search);
const gameId = params.get("game_id");

// Load players
async function loadPlayers() {
  try {
    const response = await fetch(
      `https://api.hosting.codeyourfuture.io/games/${gameId}/players`
    );
    
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

// Check game status
async function checkGameStatus() {
  try {
    const response = await fetch(
      `https://api.hosting.codeyourfuture.io/debug/game-status/${gameId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch game status");
    }

    const game = await response.json();
    console.log("Game status response:", game);

    if (game.status === "in_progress") {
      startGameBtn.disabled = false;
      startGameBtn.textContent = "Game Started!";

      setTimeout(() => {
        window.location.href = `/game.html?game_id=${gameId}`;
      }, 1000);
    }
  } catch (error) {
    console.error("Error checking game status:", error);
  }
}
// Run every 3 seconds
setInterval(() => {
  loadPlayers();
  checkGameStatus();
}, 3000);

// Initial load
loadPlayers();
checkGameStatus();
