export function navigateToResult(url) {
  document.body.classList.add("fade-out");

  setTimeout(() => {
    window.location.href = url;
  }, 350);
}
