import { showAlert } from "./alert";
import { appConfig } from "./config";
import { navigateToResult } from "./transition";
import { exitGuard } from "./exitGuard";

document.addEventListener("DOMContentLoaded", () => {

  exitGuard.allowExit = false;

  showAlert({
    message: "⚠️ Leaving this page may disconnect you from the game",
    type: "error",
    blocking: true,
    
  });

  window.addEventListener("beforeunload", (e) => {
    if (exitGuard.allowExit) return;

    e.preventDefault();
    e.returnValue = "";
  });

  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("game_id");
  console.log("game id=", gameId);

  console.log(appConfig.apiBaseUrl);
  console.log(appConfig.timer.gamePollingInterval);
  const API_BASE = appConfig.apiBaseUrl;
  
  //--------add helper functions--------------------------
  // These helpers control player input state consistently across rounds
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

    if (show) {
      el.classList.remove("opacity-0", "translate-y-2");
      el.classList.add("opacity-100", "translate-y-0");
    } else {
      el.classList.add("opacity-0", "translate-y-2");
      el.classList.remove("opacity-100", "translate-y-0");
    }

  }

  function updateWaitingMessage(status) {
    const remaining = status.pending_guesses;

    if (status.is_complete || status.is_expired) {
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

  // -------- Timer helpers --------

  // Calculates remaining time based on server start time (not client countdown)
  function getTimeLeft(roundStartedAt, duration, drift) {
    // Normalize backend datetime string (trim microseconds for JS compatibility)
    const fixedTime = roundStartedAt.slice(0, 23) + "Z";

    // Convert round start time (server reference time) into milliseconds
    const start = new Date(fixedTime).getTime();

    // drift = difference between client clock and server clock
    const now = Date.now() - drift;

    // Compute absolute end time of the round
    const endTime = start + duration * 1000;

    // Return remaining seconds (never negative)
    return Math.max(Math.ceil((endTime - now) / 1000), 0);
  }
  // Holds reference to active timer interval (used to prevent multiple timers running)
  let timerInterval = null;

  // Starts the countdown timer for a game round
  function startTimer(roundStartedAt, duration, serverTime) {
    // Prevent multiple intervals from stacking
    if (timerInterval) clearInterval(timerInterval);

    const text = document.getElementById("timeText");
    const dot = document.getElementById("pulseDot");
    const ping = document.getElementById("pulsePing");

    // Convert server time to milliseconds
    const serverNow = new Date(serverTime.slice(0, 23) + "Z").getTime();

    // Local client time at moment of sync
    const clientNow = Date.now();

    // Drift = difference between client and server clocks
    // Used to align countdown across different devices
    const drift = clientNow - serverNow;

    // TIMER UPDATE LOOP
    function update() {
      const timeLeft = getTimeLeft(roundStartedAt, duration, drift);
      text.textContent = timeLeft;

      if (timeLeft > 3) {
        dot.classList.remove("bg-red-500");
        dot.classList.add("bg-green-500");

        ping.classList.remove("bg-red-400");
        ping.classList.add("bg-green-400");
      } else {
        dot.classList.remove("bg-green-500");
        dot.classList.add("bg-red-500");

        ping.classList.remove("bg-green-400");
        ping.classList.add("bg-red-400");
      }

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        text.textContent = "0";
      }
    }
    // Run immediately so UI doesn't wait 1 second
    update();
    // Update timer every 1 second
    timerInterval = setInterval(update, 1000);
  }
  // -------- polling system ----------
  // Polling is the core sync mechanism between all players.
  // It ensures every client stays aligned with backend state.
  let pollingInterval = null;

  function startPolling() {
    if (pollingInterval) return;

    pollingInterval = setInterval(async () => {
      const status = await checkGuessStatus();
      if (!status) return;

      // Detect statement change (SYNC FIX)
      if (
        status.current_statement_id &&
        status.current_statement_id !== window.currentStatementId
      ) {
        console.log("SYNC FIX: statement changed -> reloading");

        const data = await loadStatement();

        if (data) {
          resetPlayersSelection();
          enablePlayers();
          setSubmitEnabled(false);
        }

        return;
      }

      // ---- GAME END DETECTION ----
      // Backend is the single source of truth for game lifecycle
      if (status?.game_status === "finished") {
        console.log("Game finished!");
    
        stopPolling();
    
        disablePlayers();
        setSubmitEnabled(false);
    
        // Show alert if host forced finish
        if (status.host_forced_finish) {
          showAlert({ message: "The host has finished the game early!" ,
            type: "error",
            blocking:true
          });
        
    
            // Wait 5 seconds for the players to see it
            setTimeout(() => {
              exitGuard.allowExit = true;
              navigateToResult(`/pages/result.html?game_id=${gameId}`);
            }, 5000);
        } else {
            // Normal finish, redirect immediately
            exitGuard.allowExit = true;
            navigateToResult(`/pages/result.html?game_id=${gameId}`);
        }
    
        return;
    }

      console.log("polling:", status);
      updateWaitingMessage(status);
      const currentStatementId = window.currentStatementId;

      // Round completion is detected via backend aggregation state
      if (status.is_complete) {
        console.log("Round complete detected from polling");

        const data = await loadStatement();
        if (data) {
          resetPlayersSelection();
          enablePlayers();
          setSubmitEnabled(false);
        }
      }
    }, appConfig.timer.gamePollingInterval);
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      console.log("polling stopped");
    }
  }

  // -------- statement loading ----------
  // Statement is always fetched from backend (source of truth)

  async function loadStatement() {
    const response = await fetch(
      `${API_BASE}/games/${gameId}/current-statement`,
    );

    const data = await response.json();
    console.log("statement:", data);

    //handle backend empty state
    if (data.detail) {
      console.log("No more statements:", data.detail);
      return null;
    }

    const gameRes = await fetch(`${API_BASE}/games/${gameId}`);
    const game = await gameRes.json();

    setSubmitEnabled(false);
    renderStatement(data, game);
    return data;
  }

  function renderStatement(data, game) {
    const statementText = document.getElementById("statement-text");
     const statementBox = document.querySelector(".statement-box");

     // toggle background color
     statementBox.classList.toggle("alt");
     
    if (!data || !data.statement) {
      statementText.textContent = "NO Statement available!";
      return;
    }

    statementText.textContent = data.statement;

    // Current statement id is critical for submit + polling sync
    window.currentStatementId = data.statement_id;

    // START TIMER Progress bar
    startTimer(
      game.round_started_at,
      appConfig.timer.statementTimer / 1000,
      game.server_time,
    );
    console.log(
      "timer data:",
      game.round_started_at,
      appConfig.timer.statementTimer,
    );
  }

  loadStatement();
  startPolling();

  // -------- players ----------
  // Players are static per game session (loaded once)

  async function loadPlayers() {
    const response = await fetch(`${API_BASE}/games/${gameId}/players`);
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

  // Enable submit when a player is selected

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
      showAlert({ message: "Please select a player" ,
        type:"info",
        blocking:false
      });
     
      return;
    }

    console.log("selectedPlayer:", selectedPlayerId);
    setSubmitEnabled(false);

    //setWaitingMessage("Waiting for other players...", { show: true });

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

    const response = await fetch(`${API_BASE}/games/${gameId}/guesses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

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
    showAlert({message:"Guess submitted",
      type:"info",
      blocking:false
    });
    
    disablePlayers();
    setSubmitEnabled(false);
  });

  // -------- status check ----------
  // Polling uses this endpoint as the authoritative sync mechanism

  async function checkGuessStatus() {
    if (!window.currentStatementId) return null;
    const response = await fetch(
      `${API_BASE}/games/${gameId}/guesses/status?statement_id=${window.currentStatementId}`,
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
