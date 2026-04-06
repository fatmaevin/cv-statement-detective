import { appConfig } from "./config";
import { sanitizeStatement, validatePlayerName , validateStatement} from "./validation";
import { showAlert } from "./alert";
import { showModal } from "./modal";

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

  if (!gameId) {
    showAlert({ message: "Game not found", type: "error", blocking: true });
    return;
  }
  checkGameStatus();
  setInterval(checkGameStatus, 2000);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = await checkGameStatus();
    if (status !== "waiting") {
      return;
    }

    const inputPasscode = passcode.value;

    const originalname = userName.value;
    const nameValidation = validatePlayerName(originalname);

    if (!nameValidation.isValid) {
      showAlert({
        message: nameValidation.error,
        type: "warning",
        blocking: false,
      });
      return;
    }

    const name = nameValidation.cleaned;

    const originalStatement = statement.value;
    let statementValidation = validateStatement(originalStatement);
    //validate before sanitize
        if (!statementValidation.isValid) {
          showAlert({
            message: statementValidation.error,
            type: "warning",
            blocking: false,
          });
          return;
        }

    // sanitize
    const cleanedStatement = sanitizeStatement(originalStatement);
    // validate after sanitize
    statementValidation = validateStatement(cleanedStatement);

    if (!statementValidation.isValid) {
      showAlert({message:`${statementValidation.error} after sanitize`,
        type:"warning",
        blocking:false,
      });
      return;
    }

    const hasStatementChanged = originalStatement !== cleanedStatement;

    if (hasStatementChanged) {
      showModal({
        title: "Confirm changes",
        message: `<p>We removed some unsupported characters from your statement:</p>
                   <p class="mt-2 p-2 bg-gray-100 rounded">${cleanedStatement}</p>
                    <p class="mt-2">Do you want to continue?</p>`,
        onConfirm: () => {
          submitForm(name, cleanedStatement, inputPasscode);
        },
        onCancel: () => {
          console.log("User cancelled");
        },
      });
      return;
    }
    submitForm(name, cleanedStatement, inputPasscode);
  });
  async function submitForm(name, cleanedStatement, inputPasscode) {
    const body = {
      name: name,
      statement: cleanedStatement,
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
        showAlert({
          message: errData.detail || "Something went wrong",
          type: "error",
        });
        return;
      }

      const data = await response.json();
      localStorage.setItem("player_id", data.player_id);

      window.location.href = `/pages/waiting-room.html?game_id=${data.game_id}&playerId=${data.player_id}`;
    } catch (error) {
      console.error("Error:", error);
      showAlert({
        message: "Network error",
        type: "error",
      });
    }
  }
});
