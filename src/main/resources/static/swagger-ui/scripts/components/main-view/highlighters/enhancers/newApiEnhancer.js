import { isApiRecentlyCreated } from "../newApi/dateChecker.js";
import { isApiSeenRecently, setMarkAtSeenApi } from "../../../../seenApiStorage.js";
import { updateNewApiCounter } from "../newApi/newApiCounter.js";
import { registerEnhancer } from "../core/enhancerRegistry.js";

function newApiEnhancer({ opblock, key, operation }) {
  const now = new Date();
  const DAYS_THRESHOLD = 5;
  if (!isApiRecentlyCreated(operation.operationId, now, DAYS_THRESHOLD)) return;
  if (isApiSeenRecently(key)) return;

  const descWrapper = opblock.querySelector(".opblock-summary-description");
  if (!descWrapper || descWrapper.querySelector(".new-api-badge")) return;

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

  opblock.style.backgroundColor = "#f3e8fd";
  opblock.style.borderLeft = "8px solid #6F42C1";
  opblock.style.boxShadow = "0 0 15px rgba(111, 66, 193, 0.5)";

  opblock.querySelector(".opblock-summary")?.addEventListener(
    "click",
    () => {
      setMarkAtSeenApi(key, "new");
      badge.remove();
      opblock.style.backgroundColor = "";
      opblock.style.borderLeft = "";
      opblock.style.boxShadow = "";
      updateNewApiCounter();
    },
    { once: true }
  );
}

registerEnhancer(newApiEnhancer);
