document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("showResultBtn");
  const gameId = new URLSearchParams(window.location.search).get("game_id");
  const list = document.getElementById("playersList");

  async function loadPlayers() {
    try {
      const response = await fetch(
        `https://api.hosting.codeyourfuture.io/games/${gameId}/players`
      );
      if (!response.ok) throw new Error("Failed to fetch players");

      const players = await response.json();

      list.innerHTML = "";
      players.forEach((player) => {
        const li = document.createElement("li");
        li.className = "player-item";
        li.textContent = player.name;
        list.appendChild(li);
      });
    } catch (error) {
      console.error("Error loading players:", error.message);
    }
  }

  async function checkGameStatus() {
    try {
      const response = await fetch(
        `https://api.hosting.codeyourfuture.io/games/${gameId}/status`
      );
      if (!response.ok) throw new Error("Failed to fetch game status");

      const data = await response.json();

      button.disabled = false;
    } catch (error) {
      console.error("Error checking game status:", error.message);
    }
  }

  button.addEventListener("click", () => {
    window.location.href = `/pages/result.html?game_id=${gameId}`;
  });

  loadPlayers();
  checkGameStatus();
});
