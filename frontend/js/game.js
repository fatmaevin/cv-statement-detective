document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("game_id");
  console.log("game id=", gameId);

  const submitButton = document.getElementById("submit-guess-btn");
  //-----------Load Statement---------
  async function loadStatement() {
    const response = await fetch(
      `http://localhost:8000/games/${gameId}/current-statement`,
    );

    const data = await response.json();
    console.log("statement:", data);

    //handle backend empty state
    if (data.detail) {
      console.log("No more statements:", data.detail);
      return null;
    }

    submitButton.disabled = true;
    renderStatement(data);
    return data;
  }

  function renderStatement(data) {
    const statementText = document.getElementById("statement-text");

    if (!data || !data.statement) {
      statementText.textContent = "NO Statement available!";
      return;
    }

    statementText.textContent = data.statement;
    window.currentStatementId = data.statement_id;
  }

  loadStatement();

  // ---------- Load Players ----------
  async function loadPlayers() {
    const response = await fetch(
      `http://localhost:8000/games/${gameId}/players`,
    );
    const players = await response.json();
    console.log("players:", players);
    renderPlayers(players);
  }

  loadPlayers();

  // ---------- Render Players ----------
  function renderPlayers(players) {
    const container = document.getElementById("players-options");
    container.innerHTML = "";

    players.forEach((player) => {
      const label = document.createElement("label");
      label.className = "player-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "player";
      input.value = player.player_id;

      const span = document.createElement("span");
      span.textContent = player.name;

      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
    });
  }

});