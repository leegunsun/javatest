import { apiStatusMap } from './state.js';
import { isApiSeenRecently, markApiAsSeen } from './storageService.js';

// ✅ 상태별 강조
export function highlightApiStatusFromDescription() {
  console.log("🧹 highlightApiStatusFromDescription - 기존 상태 강조 초기화");

  document.querySelectorAll(".opblock").forEach(opblock => {
    opblock.className = opblock.className.split(' ').filter(c => !c.startsWith('status-')).join(' ');

    const descWrapper = opblock.querySelector('.opblock-summary-description');
    if (descWrapper) {
      descWrapper.querySelectorAll("span[class^='badge-']").forEach(badge => badge.remove());
    }
  });

  const spec = window.ui.specSelectors.specJson().toJS();
  const paths = spec.paths;

  const emojiToTextMap = Object.entries(apiStatusMap).reduce((map, [emoji, text]) => {
    map[emoji] = text;
    return map;
  }, {});

  const dismissibleStatuses = ["✅", "⬆️"];

  Object.entries(paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const text = `${operation.summary || ""} ${operation.description || ""}`;
      const matchedEmoji = Object.keys(emojiToTextMap).find(emoji => text.includes(emoji));
      const matchedStatus = matchedEmoji ? emojiToTextMap[matchedEmoji] : undefined;

      if (!matchedStatus) return;

      const key = `${method.toUpperCase()} ${path}`;
      if (dismissibleStatuses.includes(matchedEmoji) && isApiSeenRecently(key)) return;

     const opblocks = document.querySelectorAll(".opblock");
     opblocks.forEach(opblock => {
       const elSummary = opblock.querySelector(".opblock-summary");
       const elPath = elSummary?.querySelector(".opblock-summary-path");
       const elMethod = elSummary?.querySelector(".opblock-summary-method");

       const matchesPath = elPath?.textContent === path;
       const matchesMethod = elMethod?.textContent?.toLowerCase() === method;

       if (matchesPath && matchesMethod) {
         // ✅ 원하는 대로 classList로 추가
         opblock.classList.add(`status-${matchedStatus}`);
         console.log(`✅ [STATUS] 클래스 적용 완료: status-${matchedStatus}`);

         const descWrapper = elSummary.querySelector(".opblock-summary-description");
         if (!descWrapper) {
           console.warn(`❌ [STATUS] descWrapper 없음: ${key}`);
           return;
         }

         const alreadyBadge = descWrapper.querySelector(`.badge-${matchedStatus}`);
         if (alreadyBadge) {
           console.warn(`⚠️ [STATUS] 이미 badge 존재함: ${key}`);
           return;
         }

         const badge = document.createElement("span");
         badge.textContent = matchedStatus;
         badge.className = `badge-${matchedStatus}`;
         badge.dataset.status = matchedStatus;
         badge.style.marginRight = "8px";

         // ✅ badge를 클릭했을 때 (한 번만)
         badge.addEventListener("click", () => {
           markApiAsSeen(key, "status");

           badge.remove();

           const status = badge.dataset.status;
           // ✅ classList로 삭제
           opblock.classList.remove(`status-${status}`);

           // ✅ 스타일까지 초기화
           opblock.style.backgroundColor = '';
           opblock.style.borderLeft = '';
           opblock.style.boxShadow = '';

           console.log(`✅ [STATUS] badge 삭제 및 스타일 초기화 완료: ${key}`);
         }, { once: true }); // 클릭 이벤트는 한 번만 실행

         descWrapper.appendChild(badge);
         console.log(`✅ [STATUS] badge 추가 완료: ${key}`);
       }
     });
    });
  });
}
