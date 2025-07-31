import { apiCreatedDateMap } from './state.js';
import { isApiSeenRecently, markApiAsSeen } from './storageService.js';

function updateNewApiCounter() {
  const counterEl = document.getElementById('new-api-counter');
  if (!counterEl) return;
  // 현재 화면에 남아 있는 NEW API 뱃지 개수
  const count = document.querySelectorAll('.new-api-badge').length;
  counterEl.textContent = `NEW API: ${count}개`;
}

// ✅ NEW API 강조
export function highlightNewApisFromSpec() {
  console.log("🧹 highlightNewApisFromSpec - 기존 NEW 강조 초기화");

  document.querySelectorAll(".opblock").forEach(opblock => {
    opblock.style.backgroundColor = '';
    opblock.style.borderLeft = '';
    opblock.style.boxShadow = '';

    const badge = opblock.querySelector(".new-api-badge");
    if (badge) badge.remove();
  });

  const spec = window.ui.specSelectors.specJson().toJS();
  const paths = spec.paths;
  const now = new Date();
  const DAYS_THRESHOLD = 5;

  let newApiCount = 0;  // ✅ NEW API 개수 초기화

  Object.entries(paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const operationId = operation.operationId;
      if (!operationId) return;

      let createdDate = null;
      Object.entries(apiCreatedDateMap).forEach(([controllerFullName, controllerData]) => {
        if (controllerData.methods && controllerData.methods[operationId]) {
          createdDate = controllerData.methods[operationId].date;
        }
      });

      if (!createdDate) return;

      const diffDays = Math.floor((now - new Date(createdDate)) / (1000 * 60 * 60 * 24));
      const isRecent = diffDays >= 0 && diffDays <= DAYS_THRESHOLD;

      const key = `${method.toUpperCase()} ${path}`;
      if (isRecent && !isApiSeenRecently(key)) {
        newApiCount++;  // ✅ NEW API 카운트 증가

        const opblocks = document.querySelectorAll(".opblock");
        opblocks.forEach(opblock => {
          const elSummary = opblock.querySelector(".opblock-summary");
          const elPath = elSummary?.querySelector(".opblock-summary-path");
          const elMethod = elSummary?.querySelector(".opblock-summary-method");

          const matchesPath = elPath?.textContent === path;
          const matchesMethod = elMethod?.textContent?.toLowerCase() === method;

          if (matchesPath && matchesMethod) {
            opblock.style.backgroundColor = '#f3e8fd';
            opblock.style.borderLeft = '8px solid #6F42C1';
            opblock.style.boxShadow = '0 0 15px rgba(111, 66, 193, 0.5)';

            const descWrapper = elSummary.querySelector(".opblock-summary-description");
            const alreadyBadge = descWrapper?.querySelector(".new-api-badge");

            if (descWrapper && !alreadyBadge) {
              const badge = document.createElement("span");
              badge.textContent = "NEW";
              badge.className = "new-api-badge";

              badge.style.backgroundColor = "#6F42C1";
              badge.style.color = "#fff";
              badge.style.padding = "2px 8px";
              badge.style.marginLeft = "8px";
              badge.style.borderRadius = "8px";
              badge.style.fontSize = "12px";
              badge.style.fontWeight = "bold";
              badge.style.display = "inline-block";

              descWrapper.appendChild(badge);
              console.log(`🎉 NEW 뱃지 추가 완료: ${key}`);
            }

            elSummary?.addEventListener("click", () => {
              markApiAsSeen(key, "new");

              // ✅ 이거로 교체
              opblock.style.backgroundColor = '';
              opblock.style.borderLeft = '';
              opblock.style.boxShadow = '';

              const badge = opblock.querySelector(".new-api-badge");
              if (badge) badge.remove();

              updateNewApiCounter();

              console.log(`✅ [NEW 뱃지 직접 삭제 완료] ${key}`);
            }, { once: true });
          }
        });
      }
    });
  });

  // ✅ NEW API 카운터 업데이트
 updateNewApiCounter();
}
