import { setMarkAtSeenApi, isApiSeenRecently } from "../../../../seenApiStorage.js";

export function insertStatusBadgeIfNeeded({ opblock, elDescWrapper, matchedEmoji, matchedStatus, key }) {
  const dismissibleStatuses = ["✅", "⬆️"];
  if (
    matchedStatus &&
    elDescWrapper &&
    (!dismissibleStatuses.includes(matchedEmoji) || !isApiSeenRecently(key))
  ) {
    opblock.classList.add(`status-${matchedStatus}`);
    const badgeExists = elDescWrapper.querySelector(`.badge-${matchedStatus}`);
    if (!badgeExists) {
      const badge = document.createElement("span");
      badge.textContent = matchedStatus;
      badge.className = `badge-${matchedStatus}`;
      badge.dataset.status = matchedStatus;
      badge.style.marginRight = "8px";

      if (dismissibleStatuses.includes(matchedEmoji)) {
        badge.addEventListener(
          "click",
          () => {
            setMarkAtSeenApi(key, "status");
            badge.remove();
            console.log(`✅ [STATUS] badge 삭제 및 스타일 초기화 완료: ${key}`);
          },
          { once: true }
        );
      }

      elDescWrapper.appendChild(badge);
      console.log(`✅ [STATUS] badge 추가 완료: ${key}`);
    }
  }
}
