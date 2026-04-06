export function showAlert({
  message,
  type = "info",
  blocking = false,
  duration = 4000,
}) {
  const container = document.getElementById("alert-container");

  const alert = document.createElement("div");

  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <span>${message}</span>
    <button class="alert-close">&times;</button>
  `;

  container.appendChild(alert);

  // close button
  alert.querySelector(".alert-close").onclick = () => {
    alert.remove();
  };

  // auto dismiss if NOT blocking
  if (!blocking) {
    setTimeout(() => {
      alert.remove();
    }, duration);
  }
}
