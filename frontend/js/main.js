const button = document.getElementById("create-game");
const container = document.getElementById("homepage-container");

button.addEventListener("click", () => {
  container.classList.add("animate-bounce");

  setTimeout(() => {
    container.classList.add(
      "scale-200",
      "transition-all",
      "duration-500",
      "ease-out"
    );

    setTimeout(() => {
      container.classList.add("opacity-0");
    }, 200);
  }, 1000);

  setTimeout(() => {
    window.location.href = "pages/create-game.html";
  }, 3000);
});
