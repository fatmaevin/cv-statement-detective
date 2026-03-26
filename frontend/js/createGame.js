document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createLinkForm");
  const nameInput = document.getElementById("playerName");
  const passcodeInput = document.getElementById("passcodeInput");
  const generateBtn = document.getElementById("generateBtn");

  const gameLinkDisplay = document.getElementById("gameLinkDisplay");
  const playersSection = document.getElementById("playersSection");
  const startGameBtn = document.getElementById("startGameBtn");
  const startGameNote = document.getElementById("startGameNote");
  const noPlayers = document.getElementById("noPlayers");
  const playersList = document.querySelector(".players-grid");

  let pollingInterval = null;

  nameInput.addEventListener("input", () => {
    generateBtn.disabled = nameInput.value.trim() === "";
  });

  async function loadPlayers(gameId) {
    try {
      const response = await fetch(`http://127.0.0.1:8000/games/${gameId}/players`);

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

      if (players.length > 2) {
        startGameBtn.disabled = false;
        startGameNote.textContent = "Ready to start the game!";
      } else {
        startGameBtn.disabled = true;
        startGameNote.textContent = "At least 3 players are required to start.";
      }
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hostName = nameInput.value.trim();
    const passcode = passcodeInput.value.trim();

    try {
      const response = await fetch("http://127.0.0.1:8000/games", {
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
      console.log("Create game response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create game");
      }

      // Save values immediately
      localStorage.setItem("game_id", data.game_id);
      if (data.host_id) {
        localStorage.setItem("host_id", data.host_id);
      }

      // Show game link
      const fullLink = data.game_link;
      gameLinkDisplay.style.display = "block";
      gameLinkDisplay.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="break-all font-medium text-blue-700">
            ${fullLink}
          </span>

          <div class="relative group">
            <button id="copyBtn" type="button" class="text-lg cursor-pointer hover:opacity-70">
              📋
            </button>

            <span class="absolute top-full mt-1 left-1/2 -translate-x-1/2 
                         bg-black text-white text-xs px-2 py-1 rounded 
                         opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
              Copy link
            </span>
          </div>

          <span id="copyMessage" class="text-green-500 text-sm"></span>
        </div>
      `;

      document.getElementById("copyBtn").addEventListener("click", () => {
        navigator.clipboard.writeText(data.game_link);

        const msg = document.getElementById("copyMessage");
        msg.textContent = "Copied game link";

        setTimeout(() => {
          msg.textContent = "";
        }, 3000);
      });

      // Show UI
      playersSection.style.display = "block";
      startGameBtn.style.display = "block";

      // Load players immediately
      await loadPlayers(data.game_id);

      // Start polling once
      if (!pollingInterval) {
        pollingInterval = setInterval(() => {
          const gameId = localStorage.getItem("game_id");
          if (gameId) {
            loadPlayers(gameId);
          }
        }, 3000);
      }

      console.log("Game created:", data);
    } catch (error) {
      console.error("Error:", error);
      gameLinkDisplay.style.display = "block";
      gameLinkDisplay.textContent = "Error creating game link.";
    }
  });
});