import { appConfig } from "./config";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createLinkForm");
  const nameInput = document.getElementById("playerName");
  const passcodeInput = document.getElementById("passcodeInput");
  const generateBtn = document.getElementById("generateBtn");

  const gameLinkDisplay = document.getElementById("gameLinkDisplay");
  const playersSection = document.getElementById("playersSection");
  const startGameBtn = document.getElementById("startGameBtn");
  const finishGameBtn = document.getElementById("finishGameBtn");
  const startGameNote = document.getElementById("startGameNote");
  const noPlayers = document.getElementById("noPlayers");
  const playersList = document.querySelector(".players-grid");

  let pollingInterval = null;
  const API_BASE = appConfig.apiBaseUrl;

  // Enable button only if name exists
  nameInput.addEventListener("input", () => {
    generateBtn.disabled = nameInput.value.trim() === "";
  });

  // =========================
  // LOAD PLAYERS
  // =========================
  async function loadPlayers(gameId) {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/players`);

      if (!response.ok) {
        throw new Error("Failed to fetch players");
      }

      const players = await response.json();
      playersList.innerHTML = "";

      if (players.length === 0) {
        noPlayers.style.display = "block";
        startGameBtn.disabled = true;
        startGameNote.textContent = "No players joined yet.";
        return;
      }

      noPlayers.style.display = "none";

      players.forEach((player) => {
        const li = document.createElement("li");
        li.className = "player-item";
        li.textContent = player.name;
        playersList.appendChild(li);
      });

      // IMPORTANT: Only enable if game NOT started
      if (players.length > 2 && startGameBtn.textContent !== "Game Started") {
        startGameBtn.disabled = false;
        startGameNote.textContent = "Ready to start the game!";
      } else if (startGameBtn.textContent !== "Game Started") {
        startGameBtn.disabled = true;
        startGameNote.textContent = "At least 3 players are required to start.";
      }
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }

  // =========================
  // CHECK GAME STATUS
  // =========================
  async function checkGameStatus() {
    const gameId = localStorage.getItem("game_id");
    if (!gameId) return;

    try {
      const response = await fetch(`${API_BASE}/debug/game-status/${gameId}`);
      if (!response.ok) return;

      const game = await response.json();

      if (game.status === "in_progress") {
        startGameBtn.disabled = true;
        startGameBtn.textContent = "Game Started";

        finishGameBtn.style.display = "block";
        finishGameBtn.disabled = false;
      }

      if (game.status === "finished") {
        startGameNote.textContent = "Game finished!";
        startGameBtn.disabled = true;
        finishGameBtn.disabled = true;

        // redirect host to results page
        window.location.href = `/pages/result.html?game_id=${gameId}`;
        return;
      }
    } catch (error) {
      console.error("Error checking game status:", error);
    }
  }

  // =========================
  // CREATE GAME
  // =========================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hostName = nameInput.value.trim();
    const passcode = passcodeInput.value.trim();

    try {
      const response = await fetch(`${API_BASE}/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host_name: hostName,
          passcode: passcode || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create game");
      }

      localStorage.setItem("game_id", data.game_id);

      const fullLink = data.game_link;

      gameLinkDisplay.style.display = "block";
      gameLinkDisplay.style.display = "block";
      gameLinkDisplay.innerHTML = `
        <div class="flex items-start gap-2">
          <span class="font-medium text-blue-700 break-all text-sm leading-tight">
            ${fullLink}
          </span>
      
          <button id="copyBtn" type="button" class="text-lg cursor-pointer hover:opacity-70">
            📋
          </button>
        </div>
        <span id="copyMessage" class="text-green-500 text-sm"></span>
      `;

      document.getElementById("copyBtn").addEventListener("click", () => {
        navigator.clipboard.writeText(fullLink);

        const msg = document.getElementById("copyMessage");
        msg.textContent = "Copied!";

        setTimeout(() => {
          msg.textContent = "";
        }, 2000);
      });

      playersSection.style.display = "block";
      startGameBtn.style.display = "block";

      await loadPlayers(data.game_id);

      // START POLLING
      if (!pollingInterval) {
        pollingInterval = setInterval(() => {
          const gameId = localStorage.getItem("game_id");
          if (gameId) {
            loadPlayers(gameId);
            checkGameStatus(); // ✅ KEY FIX
          }
        }, appConfig.timer.gamePollingInterval);
      }
    } catch (error) {
      console.error("Error:", error);
      gameLinkDisplay.style.display = "block";
      gameLinkDisplay.textContent = "Error creating game link.";
    }
  });

  // =========================
  // START GAME
  // =========================
  startGameBtn.addEventListener("click", async () => {
    const gameId = localStorage.getItem("game_id");

    if (!gameId) return;

    try {
      startGameBtn.disabled = true;
      startGameBtn.textContent = "Starting...";

      const response = await fetch(`${API_BASE}/games/${gameId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to start game");
      }

      startGameBtn.textContent = "Game Started";
      finishGameBtn.style.display = "block";
      finishGameBtn.disabled = false;

      startGameNote.textContent = "Game in progress...";
    } catch (error) {
      console.error("Error starting game:", error);

      startGameBtn.disabled = false;
      startGameBtn.textContent = "Start Game";
      startGameNote.textContent = "Error starting game.";
    }
  });

// =========================
// FINISH GAME BUTTON HANDLER
// =========================
finishGameBtn.addEventListener("click", async () => {
  try {
    // Get the game ID from localStorage
    const gameId = localStorage.getItem("game_id");
    if (!gameId) {
      throw new Error("Game ID not found. Make sure the game was created first.");
    }

    // Send PATCH request to finish the game (host forced)
    const res = await fetch(`${API_BASE}/games/${gameId}/finish`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host_forced: true })
    });

    // Check for server errors
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to finish game: ${res.status} ${text}`);
    }

    // Parse response JSON
    const data = await res.json();

    // Show alert only if host forced finish
    if (data.host_forced_finish) {
      alert("The host has finished the game early.");
    }

    // Redirect all players to the result page
    window.location.href = `/pages/result.html?game_id=${gameId}`;
  } catch (err) {
    console.error("Error finishing game:", err);
    alert(`An error occurred while finishing the game: ${err.message}`);
  }
});
});
