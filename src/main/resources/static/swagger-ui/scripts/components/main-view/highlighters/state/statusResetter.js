export function resetApiStatusHighlights() {
  document.querySelectorAll(".opblock").forEach((opblock) => {
    const descWrapper = opblock.querySelector(".opblock-summary-description");
    if (descWrapper) {
      descWrapper
        .querySelectorAll("span[class^='badge-']")
        .forEach((badge) => badge.remove());
    }
    const oldBookmark = opblock.querySelector(".bookmark-toggle");
    if (oldBookmark) oldBookmark.remove();
  });
}