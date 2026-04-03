import { appConfig } from "./config";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userJoinForm");
  const userName = document.getElementById("nameInput");
  const statement = document.getElementById("psInput");
  const passcode = document.getElementById("passcodeInput");

  const API_BASE = appConfig.apiBaseUrl;
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game_id");
  localStorage.setItem("game_id", gameId);

  let locked = false;
  async function checkGameStatus() {
    try {
      const response = await fetch(`${API_BASE}/debug/game-status/${gameId}`);
      if (!response.ok) throw new Error("Failed to fetch game status");

      const data = await response.json();

      if (data.status !== "waiting" && !locked) {
        locked = true;
        form.style.display = "none";
        const p = document.createElement("p");
        p.textContent = "Game already started.You can not join!";
        p.className = "text-red-500 font-bold text-center text-lg";
        form.parentNode.appendChild(p);
      }
      return data.status;
    } catch (error) {
      return null;
    }
  }
  checkGameStatus();
  setInterval(checkGameStatus, 2000);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = await checkGameStatus();

    if (status !== "waiting") {
      return;
    }

    if (!gameId) {
      alert("Game not found");
      return;
    }

    const name = userName.value;
    const statementInput = statement.value;
    const inputPasscode = passcode.value;

    const body = {
      name: name,
      statement: statementInput,
    };
    if (inputPasscode) {
      body.passcode = inputPasscode;
    }

    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.detail || "Something went wrong");
        return;
      }

      const data = await response.json();
      localStorage.setItem("player_id", data.player_id);

      window.location.href = `/pages/waiting-room.html?game_id=${data.game_id}&playerId=${data.player_id}`;
    } catch (error) {
      console.error("Error:", error);
      alert("Network error");
    }
  });
});
