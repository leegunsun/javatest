export function updateNewApiCounter() {
  const counterEl = document.getElementById("new-api-counter");
  if (!counterEl) return;
  const count = document.querySelectorAll(".new-api-badge").length;
  counterEl.textContent = `NEW API: ${count}개`;
}
