import { appConfig } from "./config";
import { showAlert } from "./alert";
import { navigateToResult } from "./transition";
import { validatePlayerName } from "./validation";

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

  // =========================
  // BUTTON STATE
  // =========================
  function updateGenerateButtonState() {
    generateBtn.disabled = nameInput.value.trim() === "";
  }
  updateGenerateButtonState();
  nameInput.addEventListener("input", updateGenerateButtonState);
  // =========================
  // SHOW GAME SCREEN
  // =========================
  function showGameScreen() {
    const gameLink = localStorage.getItem("game_link");
    if (!gameLink) return;

    gameLinkDisplay.style.display = "block";
    gameLinkDisplay.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="font-medium text-blue-700 break-all text-sm leading-tight">${gameLink}</span>
        <button id="copyBtn" type="button" class="text-lg cursor-pointer">📋</button>
      </div>
      <span id="copyMessage" class="text-green-500 text-sm"></span>
    `;

    document.getElementById("copyBtn").addEventListener("click", () => {
      navigator.clipboard.writeText(gameLink);
      const msg = document.getElementById("copyMessage");
      msg.textContent = "Copied!";
      setTimeout(() => (msg.textContent = ""), 2000);
    });

    // populate inputs
    nameInput.value = localStorage.getItem("host_name") || "";
    passcodeInput.value = localStorage.getItem("passcode") || "";

    // Disable inputs (host cannot change after creation)
    nameInput.disabled = true;
    passcodeInput.disabled = true;

    generateBtn.textContent = "Game Created";
    generateBtn.disabled = true;

    playersSection.style.display = "block";
    startGameBtn.style.display = "block";
  }

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
        startGameNote.textContent = "";
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

        localStorage.removeItem("game_id");
        localStorage.removeItem("game_link");
        localStorage.removeItem("host_name");
        localStorage.removeItem("passcode");

        navigateToResult(`/pages/result.html?game_id=${gameId}`);
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

    generateBtn.disabled = true;
    generateBtn.textContent = "Game Creating...";

    const hostName = nameInput.value.trim();
    const passcode = passcodeInput.value.trim();

    try {
      const response = await fetch(`${API_BASE}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host_name: hostName, passcode: passcode || "" }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to create game");

      // save in localStorage for reloads
      localStorage.setItem("game_id", data.game_id);
      localStorage.setItem("game_link", data.game_link);
      localStorage.setItem("host_name", hostName);
      if (passcode) localStorage.setItem("passcode", passcode);

      // Disable inputs immediately
      nameInput.disabled = true;
      passcodeInput.disabled = true;

      showGameScreen();
      await loadPlayers(data.game_id);
      await checkGameStatus();

      // Start polling
      if (!pollingInterval) {
        pollingInterval = setInterval(() => {
          const gameId = localStorage.getItem("game_id");
          if (gameId) {
            loadPlayers(gameId);
            checkGameStatus();
          }
        }, appConfig.timer.gamePollingInterval);
      }
    } catch (error) {
      console.error("Error creating game:", error);
      gameLinkDisplay.style.display = "block";
      gameLinkDisplay.textContent = "Error creating game link.";

      generateBtn.disabled = false;
      generateBtn.textContent = "Generate Link";
    }
  });

  // =========================
  // ON PAGE LOAD: RESTORE GAME
  // =========================
  if (localStorage.getItem("game_id")) {
    showGameScreen();
    const gameId = localStorage.getItem("game_id");
    loadPlayers(gameId);
    checkGameStatus();

    // Start polling if not already started
    if (!pollingInterval) {
      pollingInterval = setInterval(() => {
        const gameId = localStorage.getItem("game_id");
        if (gameId) {
          loadPlayers(gameId);
          checkGameStatus();
        }
      }, appConfig.timer.gamePollingInterval);
    }
  }

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
      if (!response.ok) throw new Error("Failed to start game");

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
      const gameId = localStorage.getItem("game_id");
      if (!gameId) throw new Error("Game ID not found.");

      const res = await fetch(`${API_BASE}/games/${gameId}/finish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host_forced: true }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to finish game: ${res.status} ${text}`);
      }

      // Stop polling and clear localStorage
      if (pollingInterval) clearInterval(pollingInterval);
      localStorage.removeItem("game_id");
      localStorage.removeItem("game_link");
      localStorage.removeItem("host_name");
      localStorage.removeItem("passcode");
      showAlertAsync({
        message: "The host has finished the game early.",
        type: "warning",
        blocking: true,
      });
      // Redirect host after closing alert
      navigateToResult(`/pages/result.html?game_id=${gameId}`);
    } catch (err) {
      console.error("Error finishing game:", err);
      showAlert({
        message: `An error occurred while finishing the game: ${err.message}`,
        type: "error",
        blocking: true,
      });
    }
  });

  // =========================
  // HELPER FUNCTION TO SHOW ALERT AND WAIT FOR DISMISSAL
  // =========================

  function showAlertAsync(options) {
    return new Promise((resolve) => {
      showAlert({
        ...options,
        onDismiss: resolve,
      });
    });
  }
  // =========================
});
