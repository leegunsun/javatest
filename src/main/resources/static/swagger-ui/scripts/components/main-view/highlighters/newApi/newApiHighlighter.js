
import { isApiRecentlyCreated } from "./dateChecker.js";
import { findMatchingOpblocks } from "./opblockFinder.js";
import { markNewApi } from "./newApiMarker.js";
import { updateNewApiCounter } from "./newApiCounter.js";
import { isApiSeenRecently } from "../../../../seenApiStorage.js";

export function highlightNewApisFromSpec() {
  console.log("🧹 highlightNewApisFromSpec - 기존 NEW 강조 초기화");
    document.querySelectorAll(".opblock").forEach((opblock) => {
    opblock.style.backgroundColor = "";
    opblock.style.borderLeft = "";
    opblock.style.boxShadow = "";

    const badge = opblock.querySelector(".new-api-badge");
    if (badge) badge.remove();
  });

  const spec = window.ui.specSelectors.specJson().toJS();
  const now = new Date();
  const DAYS_THRESHOLD = 5;

  Object.entries(spec.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const operationId = operation.operationId;
      if (!operationId) return;

      const key = `${method.toUpperCase()} ${path}`;

      if (isApiRecentlyCreated(operationId, now, DAYS_THRESHOLD) && !isApiSeenRecently(key)) {
        const matchedOpblocks = findMatchingOpblocks(path, method);
        matchedOpblocks.forEach((opblock) => markNewApi(opblock, key));
      }
    });
  });

  updateNewApiCounter();
}