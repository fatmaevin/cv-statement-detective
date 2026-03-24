document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userJoinForm");
  const userName = document.getElementById("nameInput");
  const statement = document.getElementById("psInput");
  const passcode = document.getElementById("passcodeInput");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("gameId");
    const urlPasscode = params.get("passcode");

    if (!gameId) {
      alert("Game not found");
      return;
    }
    if (urlPasscode) {
      passcode.value = urlPasscode;
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
        `http://localhost:8000/games/${gameId}/players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        alert("Something went wrong");
        return;
      }

      const data = await response.json();

      window.location.href = `/pages/waiting-room.html?gameId=${data.game_id}&playerId=${data.player_id}`;
    } catch (error) {
      console.error("Error:", error);
      alert("Network error");
    }
  });
});
