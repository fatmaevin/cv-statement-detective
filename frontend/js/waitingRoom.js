const playersList = document.getElementById("playersList");
const playerCount = document.getElementById("playerCount");
const startGameBtn = document.getElementById("startGameBtn");

// Get game_id from localStorage
const gameId = localStorage.getItem("game_id");

// Load players
async function loadPlayers() {
  try {
    const response = await fetch(`http://127.0.0.1:8000/games/${gameId}/players`);

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
    const response = await fetch(`http://127.0.0.1:8000/games/${gameId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch game status");
    }

    const game = await response.json();

    if (game.status === "in_progress") {
      startGameBtn.disabled = false;

      // redirect automatically
      window.location.href = `/game.html?game_id=${gameId}`;
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