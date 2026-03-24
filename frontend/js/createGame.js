document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("createLinkForm");
const nameInput = document.getElementById("playerName");
const passcodeInput = document.getElementById("passcodeInput");
const generateBtn = document.getElementById("generateBtn");

const gameLinkDisplay = document.getElementById("gameLinkDisplay");
const playersSection = document.getElementById("playersSection");
const startGameBtn = document.getElementById("startGameBtn");

// Enable button only when name is filled
nameInput.addEventListener("input", () => {
generateBtn.disabled = nameInput.value.trim() === "";
});

// When user clicks "Generate Game Link"
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

    if (!response.ok) {
      throw new Error("Failed to create game");
    }

    const data = await response.json();

    // Show game link
    const fullLink = `Game Link: ${data.game_link}`;
    gameLinkDisplay.style.display = "block";
    gameLinkDisplay.textContent = fullLink;

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
  
  });
    

    // Store host_id in localStorage for later use
    localStorage.setItem("host_id", data.host_id); 


    async function loadPlayers(gameId) {
        try {
          const response = await fetch(`http://127.0.0.1:8000/games/${gameId}/players`);
      
          if (!response.ok) {
            throw new Error("Failed to fetch players");
          }
      
          const players = await response.json();
      
          const playersList = document.querySelector(".players-grid");
          const noPlayers = document.getElementById("noPlayers");
          const startGameBtn = document.getElementById("startGameBtn");
      
          // Optional message element (if you add it in HTML)
          const startGameNote = document.getElementById("startGameNote");
      
          // Clear previous players
          playersList.innerHTML = "";
      
          // No players case
          if (players.length === 0) {
            noPlayers.style.display = "block";
            startGameBtn.disabled = true;
      
            if (startGameNote) {
              startGameNote.textContent = "No players joined yet.";
            }
      
            return;
          }
      
          // Hide "no players"
          noPlayers.style.display = "none";
      
          // Render players
          players.forEach((player) => {
            const li = document.createElement("li");
            li.className = "player-item";
            li.textContent = player.name;
            playersList.appendChild(li);
          });
      
          // Enable start button only if >= 3 players
          if (players.length > 2) {
            startGameBtn.disabled = false;
      
            if (startGameNote) {
              startGameNote.textContent = "Ready to start the game!";
            }
      
          } else {
            startGameBtn.disabled = true;
      
            if (startGameNote) {
              startGameNote.textContent = "At least 3 players are required to start.";
            }
          }
      
        } catch (error) {
          console.error("Error loading players:", error);
        }
      }

    playersSection.style.display = "block";

    // Load players
    setInterval(() => {
        const gameId = localStorage.getItem("game_id");
        if (gameId) {
          loadPlayers(gameId);
        }
      }, 3000); // every 3 seconds

    // Show start game button
    startGameBtn.style.display = "block";

    console.log("Game created:", data);
  } catch (error) {
    console.error("Error:", error);

    gameLinkDisplay.style.display = "block";
    gameLinkDisplay.textContent = "Error creating game link.";
  }
});

});