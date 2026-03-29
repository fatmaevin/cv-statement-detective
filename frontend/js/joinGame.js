document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userJoinForm");
  const userName = document.getElementById("nameInput");
  const statement = document.getElementById("psInput");
  const passcode = document.getElementById("passcodeInput");

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game_id");
  const urlPasscode = params.get("passcode");
  
  if (urlPasscode) {
    passcode.value = urlPasscode;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

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
      const response = await fetch(
        `https://api.hosting.codeyourfuture.io/games/${gameId}/players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.detail || "Something went wrong");
        return;
      }

      const data = await response.json();

      window.location.href = `/pages/waiting-room.html?game_id=${data.game_id}&playerId=${data.player_id}`;
    } catch (error) {
      console.error("Error:", error);
      alert("Network error");
    }
  });
});
