import { showAlert } from "./alert";
import { appConfig } from "./config";

document.addEventListener("DOMContentLoaded", () => {
  const totalStatement = document.getElementById("total-statement");
  const statementsAndScores = document.getElementById("results-container");

  const API_BASE = appConfig.apiBaseUrl;

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game_id");

  async function getStatements() {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/results`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      data.sort((a, b) => b.score - a.score);

      totalStatement.textContent = `Total statements: ${data.length}`;

      data.forEach((item) => {
        const resultItem = document.createElement("div");
        resultItem.className = "result-item";

        const statementCard = document.createElement("div");
        statementCard.className = "statement-card";

        const statementText = document.createElement("p");
        statementText.className = "statement-text";
        statementText.textContent = item.statement;

        const ownerName = document.createElement("span");
        ownerName.className = "owner-name";
        ownerName.textContent = `${item.owner_name}`;

        const scoreCard = document.createElement("div");
        scoreCard.className = "score-card";

        const score = document.createElement("p");
        score.className = "font-semibold";
        score.textContent = `Score: ${item.score}`;

        statementCard.appendChild(statementText);
        statementCard.appendChild(ownerName);
        scoreCard.appendChild(score);
        statementCard.appendChild(scoreCard)
        resultItem.appendChild(statementCard);
        statementsAndScores.appendChild(resultItem);
      });
    } catch (error) {
      console.error("Error fetching statements:", error);
      showAlert({ message: "Failed to load results. Please try again later." ,
        type: "error",
        blocking: true
      });
      // statementsAndScores.textContent =
      //   "Failed to load results. Please try again later.";
      totalStatement.textContent = "Total statements: 0";
    }
  }

  getStatements();
});
