export function showModal({
  title = "Confirm",
  message = "",
  onConfirm,
  onCancel,
}) {
  const root = document.getElementById("modal-root");
  const titleEl = document.getElementById("modal-title");
  const messageEl = document.getElementById("modal-message");
  const okBtn = document.getElementById("modal-ok");
  const cancelBtn = document.getElementById("modal-cancel");

  // set content
  titleEl.textContent = title;
  messageEl.textContent = message;

  // show modal
  root.classList.remove("hidden");

  // clear old handlers
  okBtn.onclick = null;
  cancelBtn.onclick = null;

  // OK
  okBtn.onclick = () => {
    root.classList.add("hidden");
    onConfirm?.();
  };

  // Cancel
  cancelBtn.onclick = () => {
    root.classList.add("hidden");
    onCancel?.();
  };

  // click outside
  root.onclick = (e) => {
    if (e.target === root) {
      root.classList.add("hidden");
      onCancel?.();
    }
  };
}
