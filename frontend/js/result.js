document.addEventListener("DOMContentLoaded", () => {
  const totalStatement = document.getElementById("total-statement");
  const statementsAndScores = document.getElementById("results-container");
  const API_URL = "https://api.hosting.codeyourfuture.io";

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game_id");

  async function getStatements() {
    try {
      const response = await fetch(`${API_URL}/games/${gameId}/results`);

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
        statementCard.textContent = `${item.statement}`;

        const scoreCard = document.createElement("div");
        scoreCard.className = "score-card";

        const score = document.createElement("p");
        score.className = "font-semibold";
        score.textContent = `Score: ${item.score}`;

        scoreCard.appendChild(score);
        resultItem.appendChild(statementCard);
        resultItem.appendChild(scoreCard);
        statementsAndScores.appendChild(resultItem);
      });
    } catch (error) {
      console.error("Error fetching statements:", error);
      statementsAndScores.textContent =
        "Failed to load results. Please try again later.";
      totalStatement.textContent = "Total statements: 0";
    }
  }

  getStatements();
});
