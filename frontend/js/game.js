document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("game_id");
  console.log("game id=", gameId);

  //--------add helper functions--------------------------
  function getPlayerInputs() {
    return document.querySelectorAll('input[name="player"]');
  }

  function disablePlayers() {
    getPlayerInputs().forEach((input) => (input.disabled = true));
  }

  function enablePlayers() {
    getPlayerInputs().forEach((input) => (input.disabled = false));
  }

  function resetPlayersSelection() {
    getPlayerInputs().forEach((input) => (input.checked = false));
  }

  function setWaitingMessage(text = "", { show = true } = {}) {
    const el = document.getElementById("waiting-message");

    el.textContent = text;

    el.style.display = show ? "block" : "none";
  }

  function updateWaitingMessage(status) {
    const remaining = status.pending_guesses;

    if (status.is_complete) {
      setWaitingMessage("Loading next statement...", { show: true });
    } else {
      setWaitingMessage(
        `Waiting for ${remaining} player${remaining === 1 ? "" : "s"}...`,
        { show: true },
      );
    }

    // store for sync
    window.latestState = status;
  }

  function setSubmitEnabled(enabled) {
    const submitButton = document.getElementById("submit-guess-btn");
    submitButton.disabled = !enabled;
  }

  //-----------Add polling-------------
  // Polling mechanism to periodically check if all players have submitted guesses
  let pollingInterval = null;

  function startPolling() {
    if (pollingInterval) return;
    pollingInterval = setInterval(async () => {
      const status = await checkGuessStatus();
      if (!status) return;
      if (status?.game_status === "finished") {
        console.log("Game finished!");

        stopPolling();

        setWaitingMessage("Game finished! Showing results...", { show: true });

        disablePlayers();
        setSubmitEnabled(false);

        window.location.href = `/pages/result.html?game_id=${gameId}`;

        return;
      }

      console.log("polling:", status);
      updateWaitingMessage(status);
      const currentStatementId = window.currentStatementId;

      if (status.is_complete) {
        console.log("Round complete detected from polling");

        const data = await loadStatement();
        if (data) {
          resetPlayersSelection();
          enablePlayers();
          setSubmitEnabled(false);
        }
      }
    }, 4000);
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      console.log("polling stopped");
    }
  }

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

    setSubmitEnabled(false);
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
  startPolling();

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

  // ---------- Enable Submit ----------

  document.getElementById("players-options").addEventListener("change", (e) => {
    if (e.target.name === "player") {
      setSubmitEnabled(true);
    }
  });

  // ---------- Get Selected player----------
  function getSelectedPlayer() {
    const selected = document.querySelector('input[name="player"]:checked');
    return selected ? selected.value : null;
  }

  // ---------- Submit ----------
  const form = document.getElementById("player-guess-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedPlayerId = getSelectedPlayer();

    if (!selectedPlayerId) {
      alert("Please select a player");
      return;
    }

    console.log("selectedPlayer:", selectedPlayerId);
    setSubmitEnabled(false);

    setWaitingMessage("Waiting for other players...", { show: true });

    // Disable all player inputs
    disablePlayers();

    // Save the statement ID when submitting to prevent timing issues with polling
    const currentStatementId = window.currentStatementId;
    const playerId = Number(localStorage.getItem("player_id")) || 1;

    const payload = {
      player_id: playerId,
      statement_id: currentStatementId,
      guessed_player_id: Number(selectedPlayerId),
    };

    const response = await fetch(
      `http://localhost:8000/games/${gameId}/guesses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();
    // Handle backend errors
    if (!response.ok) {
      console.log("submit failed", result);

      setWaitingMessage("", { show: false });

      enablePlayers();

      setSubmitEnabled(true);

      return;
    }
    console.log("submit result", result);
    setWaitingMessage("Waiting for other players...", { show: true });
    disablePlayers();
    setSubmitEnabled(false);
  });

  // ---------- Check statement status ----------
  async function checkGuessStatus() {
    if (!window.currentStatementId) return null;
    const response = await fetch(
      `http://localhost:8000/games/${gameId}/guesses/status?statement_id=${window.currentStatementId}`,
    );
    if (!response.ok) {
      console.log("Failed to fetch guess status");
      return null;
    }
    const status = await response.json();
    console.log("guess status:", status);
    return status;
  }
});
