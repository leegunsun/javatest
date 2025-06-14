import { resetApiStatusHighlights } from "./statusResetter.js";
import { findAllOpblocks } from "./opblockFinder.js";
import { extractStatusFromText } from "./statusMatcher.js";
import { insertStatusBadgeIfNeeded } from "./statusBadgeInserter.js";
import { insertBookmarkToggle } from "./bookmarkToggle.js";

export function highlightApiStatusFromDescription() {
  console.log("🧹 highlightApiStatusFromDescription - 기존 상태 강조 초기화");
  resetApiStatusHighlights();

  const spec = window.ui.specSelectors.specJson().toJS();
  const paths = spec.paths;

  const opblocks = findAllOpblocks();
  opblocks.forEach((opblock) => {
    const elSummary = opblock.querySelector(".opblock-summary");
    const elPath = elSummary?.querySelector(".opblock-summary-path");
    const elMethod = elSummary?.querySelector(".opblock-summary-method");
    const elDescWrapper = elSummary?.querySelector(".opblock-summary-description");

    if (!elPath || !elMethod) return;

    const path = elPath.textContent;
    const method = elMethod.textContent.toLowerCase();
    const key = `${method.toUpperCase()} ${path}`;
    const operation = paths?.[path]?.[method];
    if (!operation) return;

    const text = `${operation.summary || ""} ${operation.description || ""}`;
    const { matchedEmoji, matchedStatus } = extractStatusFromText(text);

    const usedPath = path.split("/");
    const setData = {
      rootTagName: operation.tags?.[0],
      subTagName: operation.operationId + usedPath[2],
      method,
      rootPath: usedPath[2],
      subPath: usedPath[3],
    };

    insertBookmarkToggle(setData, elSummary);
    insertStatusBadgeIfNeeded({ opblock, elDescWrapper, matchedEmoji, matchedStatus, key });
  });
}