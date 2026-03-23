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
        host_id: 1,
        passcode: passcode || "",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create game");
    }

    const data = await response.json();

    // Show game link
    gameLinkDisplay.style.display = "block";
    gameLinkDisplay.textContent = `Game Link: ${data.game_link}`;

    // Show players section
    playersSection.style.display = "block";

    // Show start game button
    startGameBtn.style.display = "block";

    console.log("Game created:", data);
  } catch (error) {
    console.error("Error:", error);

    gameLinkDisplay.style.display = "block";
    gameLinkDisplay.textContent = "Error creating game link.";
  }
});