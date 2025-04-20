
let apiStatusMap = {}; // JSON에서 로드될 상태 매핑

window.onload = function () {
  // 상태 JSON을 먼저 불러오고, 이후 Swagger UI 초기화
  fetch("/swagger-status/api-status.json")
    .then(res => res.json())
    .then(statusMap => {
      apiStatusMap = statusMap;
      console.log("✅ api-status.json 로드 완료:", apiStatusMap);

      const ui = SwaggerUIBundle({
        url: "/v3/api-docs",
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout",
        onComplete: function () {
          console.log("✅ Swagger UI 로딩 완료");
          setTimeout(() => {
            highlightApiStatusFromDescription();  // 상태 강조
            highlightNewApisFromSpec();          // 신규 API 강조
          }, 1000);
        }
      });

      window.ui = ui;
    });
};

// ✅ seenApis 관리 로직
function getSeenApis() {
  const raw = localStorage.getItem("seenApis");
  return raw ? JSON.parse(raw) : {};
}

function markApiAsSeen(key, type = "status") {
  const seen = getSeenApis();
  seen[key] = { type, timestamp: new Date().toISOString() };
  localStorage.setItem("seenApis", JSON.stringify(seen));
}

function isApiSeenRecently(key) {
  const seen = getSeenApis()[key];
  if (!seen) return false;

  const saved = new Date(seen.timestamp);
  const now = new Date();
  const diffDays = (now - saved) / (1000 * 60 * 60 * 24);
  return true;
}

// ✅ NEW API 강조
function highlightNewApisFromSpec() {
  const spec = window.ui.specSelectors.specJson().toJS();
  const paths = spec.paths;
  const DAYS_THRESHOLD = 1;
  const now = new Date();

  const seenApis = getSeenApis();

  Object.entries(paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const description = operation.description || "";
      const hasNewTag = description.includes("🆕");
      const dateMatch = description.match(/\d{4}-\d{2}-\d{2}/);
      let isRecentDate = false;

      if (dateMatch) {
        const apiDate = new Date(dateMatch[0]);
        const diffDays = Math.floor((now - apiDate) / (1000 * 60 * 60 * 24));
        isRecentDate = diffDays >= 0 && diffDays <= DAYS_THRESHOLD;
      }

      const key = `${method.toUpperCase()} ${path}`;
      const isAlreadySeen = key in seenApis;

      if ((hasNewTag || isRecentDate) && !isAlreadySeen) {
        const opblocks = document.querySelectorAll(`.opblock`);
        opblocks.forEach(opblock => {
          const elSummary = opblock.querySelector('.opblock-summary');
          const elPath = elSummary?.querySelector('.opblock-summary-path');
          const elMethod = elSummary?.querySelector('.opblock-summary-method');

          const matchesPath = elPath?.textContent === path;
          const matchesMethod = elMethod?.textContent?.toLowerCase() === method;

          if (matchesPath && matchesMethod) {
            console.log(`✨ NEW 강조 적용: ${key}`);

            opblock.style.backgroundColor = '#f3e8fd';
            opblock.style.borderLeft = '8px solid #6F42C1';
            opblock.style.boxShadow = '0 0 15px rgba(111, 66, 193, 0.5)';

            const descWrapper = opblock.querySelector(".opblock-summary-description");
            if (!descWrapper) {
              console.warn(`❌ [NEW] descWrapper 없음: ${key}`);
            }

            const alreadyBadge = descWrapper?.querySelector(".new-api-badge");
            if (alreadyBadge) {
              console.warn(`⚠️ [NEW] 이미 badge 존재함: ${key}`);
            }

            if (descWrapper && !alreadyBadge) {
              const badge = document.createElement("span");
              badge.textContent = "NEW";
              badge.className = "new-api-badge";
              badge.style.backgroundColor = "#6F42C1";
              badge.style.color = "#fff";
              badge.style.padding = "2px 8px";
              badge.style.marginRight = "8px";
              badge.style.borderRadius = "8px";
              badge.style.fontSize = "12px";
              badge.style.fontWeight = "bold";
              badge.style.display = "inline-block";

              descWrapper.appendChild(badge);
              console.log(`✅ [NEW] badge 추가 완료: ${key}`);
            }

            elSummary?.addEventListener("click", () => {
              markApiAsSeen(key, "new");
              console.log(`👁️‍🗨️ API 확인 처리됨: ${key}`);

              opblock.style.backgroundColor = '';
              opblock.style.borderLeft = '';
              opblock.style.boxShadow = '';

              const badge = opblock.querySelector(".new-api-badge");
              if (badge) {
                badge.remove();
              }
            });
          }
        });
      }
    });
  });
}

// ✅ 상태별 강조
function highlightApiStatusFromDescription() {
  const spec = window.ui.specSelectors.specJson().toJS();
  const paths = spec.paths;

  // ✅ 이모티콘 → 텍스트 역맵 생성
  const emojiToTextMap = Object.entries(apiStatusMap).reduce((map, [emoji, text]) => {
    map[emoji] = text;
    return map;
  }, {});

  const dismissibleStatuses = ["✅", "⬆️"]; // 여전히 이모티콘으로 감지

  Object.entries(paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const text = `${operation.summary || ""} ${operation.description || ""}`;

      // ✅ summary에 이모티콘이 포함되어 있으면 감지
      const matchedEmoji = Object.keys(emojiToTextMap).find(emoji => text.includes(emoji));
      const matchedStatus = matchedEmoji ? emojiToTextMap[matchedEmoji] : undefined;

      console.log(`🔍 [STATUS] key=${method.toUpperCase()} ${path}, emoji=${matchedEmoji}, status=${matchedStatus}`);
      if (!matchedStatus) return;

      const key = `${method.toUpperCase()} ${path}`;
      if (dismissibleStatuses.includes(matchedEmoji) && isApiSeenRecently(key)) return;

      const opblocks = document.querySelectorAll(`.opblock`);
      opblocks.forEach(opblock => {
        const elSummary = opblock.querySelector('.opblock-summary');
        const elPath = elSummary?.querySelector('.opblock-summary-path');
        const elMethod = elSummary?.querySelector('.opblock-summary-method');

        const matchesPath = elPath?.textContent === path;
        const matchesMethod = elMethod?.textContent?.toLowerCase() === method;

        if (matchesPath && matchesMethod) {
          opblock.classList.add(`status-${matchedStatus}`);
          console.log(`✅ [STATUS] 클래스 적용 완료: status-${matchedStatus}`);

          const descWrapper = elSummary.querySelector(".opblock-summary-description");
          if (!descWrapper) {
            console.warn(`❌ [STATUS] descWrapper 없음: ${key}`);
          }

          const alreadyBadge = descWrapper?.querySelector(`.badge-${matchedStatus}`);
          if (alreadyBadge) {
            console.warn(`⚠️ [STATUS] 이미 badge 존재함: ${key}`);
          }

          if (descWrapper && !alreadyBadge) {
            const badge = document.createElement("span");
            badge.textContent = matchedStatus; // 텍스트만 출력
            badge.className = `badge-${matchedStatus}`;
            badge.dataset.status = matchedStatus;
            badge.style.marginRight = "8px";

            badge.addEventListener("click", () => {
              markApiAsSeen(key, "status");

              badge.remove();

              const status = badge.dataset.status;
              opblock.classList.remove(`status-${status}`);
              opblock.style.backgroundColor = '';
              opblock.style.borderLeft = '';
              opblock.style.boxShadow = '';
            });

            descWrapper.appendChild(badge);
            console.log(`✅ [STATUS] badge 추가 완료: ${key}`);
          }
        }
      });
    });
  });
}
