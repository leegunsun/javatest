export function resetNewApiHighlights() {
  document.querySelectorAll(".opblock").forEach((opblock) => {
    opblock.style.backgroundColor = "";
    opblock.style.borderLeft = "";
    opblock.style.boxShadow = "";

    const badge = opblock.querySelector(".new-api-badge");
    if (badge) badge.remove();
  });
}