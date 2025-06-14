import { updateNewApiCounter } from "./newApiCounter.js";
import { setMarkAtSeenApi } from "../../../../seenApiStorage.js";

export function markNewApi(opblock, key) {
  opblock.style.backgroundColor = "#f3e8fd";
  opblock.style.borderLeft = "8px solid #6F42C1";
  opblock.style.boxShadow = "0 0 15px rgba(111, 66, 193, 0.5)";

  const elSummary = opblock.querySelector(".opblock-summary");
  const descWrapper = elSummary?.querySelector(".opblock-summary-description");
  const alreadyBadge = descWrapper?.querySelector(".new-api-badge");

  if (descWrapper && !alreadyBadge) {
    const badge = document.createElement("span");
    badge.textContent = "NEW";
    badge.className = "new-api-badge";
    Object.assign(badge.style, {
      backgroundColor: "#6F42C1",
      color: "#fff",
      padding: "2px 8px",
      marginLeft: "8px",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: "bold",
      display: "inline-block",
    });
    descWrapper.appendChild(badge);
    console.log(`🎉 NEW 뱃지 추가 완료: ${key}`);
  }

  elSummary?.addEventListener(
    "click",
    () => {
      setMarkAtSeenApi(key, "new");
      opblock.style.backgroundColor = "";
      opblock.style.borderLeft = "";
      opblock.style.boxShadow = "";
      const badge = opblock.querySelector(".new-api-badge");
      if (badge) badge.remove();
      updateNewApiCounter();
      console.log(`✅ [NEW 뱃지 직접 삭제 완료] ${key}`);
    },
    { once: true }
  );
}