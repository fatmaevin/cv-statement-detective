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

  function setSubmitEnabled(enabled) {
    const submitButton = document.getElementById("submit-guess-btn");
    submitButton.disabled = !enabled;
  }

  //---------------------------------------------------------------------
  const submitButton = document.getElementById("submit-guess-btn");
  const waitingMessage = document.getElementById("waiting-message");

  // Stops the game from running multiple times at the same time
  let isProcessingGameFlow = false;

  // Checks if the user has already made a guess for the current statement
  // Used to make sure the game doesn’t move to the next statement before the user acts
  let hasSubmittedGuess = false;

  //-----------Add polling-------------
  // Polling mechanism to periodically check if all players have submitted guesses
  let pollingInterval = null;
 
  function startPolling() {
    if (pollingInterval) return;
    pollingInterval = setInterval(async () => {
      const status = await checkGuessStatus();
      if (!status) return;

      console.log("polling:", status);
      if (status.is_complete ) {
        await handleGameFlow();
        
        // Reset flag for next statement
        hasSubmittedGuess = false;
      }
    }, 4000);
  }

  function stopPolling(){
    if(pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval=null;
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

    //Mark that current player has submitted a guess
    hasSubmittedGuess = true;

    console.log("selectedPlayer:", selectedPlayerId);
    setSubmitEnabled(false);
    

    // Show waiting message
    const status=await checkGuessStatus();
    if(status){
        setWaitingMessage(`Waiting for ${status.pending_guesses} players...`);
    }else{
        setWaitingMessage("Waiting for other players...");
    }

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
      hasSubmittedGuess=false;
      setWaitingMessage("",{ show : false });

      enablePlayers();

      setSubmitEnabled(true);

      return;
    }
    console.log("submit result", result);
    await handleGameFlow();
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
  //--------handle game flow---------------------------
  window.handleGameFlow = async function () {
    // Prevent concurrent executions
    if (isProcessingGameFlow) return;
    isProcessingGameFlow = true;

    try {
      const status = await checkGuessStatus();
      if (!status) return;

      console.log("guess status:", status);

      if (status.is_complete) {
        console.log("statement finished, loading next ...");

        const data = await loadStatement();

        hasSubmittedGuess=false;

        // Hide waiting message for next round
        setWaitingMessage("", { show: false });

        // Re-enable inputs for next round
        enablePlayers();

        if (!data) {
          console.log("Game finished");
          stopPolling();
          setWaitingMessage("🎉 Game finished!",{ show:true });
         
          setSubmitEnabled(false);
          
          disablePlayers();
          resetPlayersSelection();

          //---------redirect to next page---------------
          setTimeout(()=>{
            window.location.href = `/pages/waiting-result?{game_id=${gameId}}`;
          },3000);
          return;
        }
        setSubmitEnabled(false);
        

        //reset UI
        resetPlayersSelection();

        return data;
      }

      // Release lock after processing completes
    } finally {
      isProcessingGameFlow = false;
    }
  };
});