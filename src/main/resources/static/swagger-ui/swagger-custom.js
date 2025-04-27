let apiStatusMap = {};        // 상태 뱃지용
let apiCreatedDateMap = {};   // NEW 강조용

window.onload = function () {
  // 1단계: api-status.json 로드
  fetch("/swagger-status/api-status.json")
    .then(res => res.json())
    .then(statusMap => {
      if (statusMap.status === 404 || statusMap.error) {
        console.error("❌ api-status.json 로딩 실패:", statusMap);
      } else {
        apiStatusMap = statusMap;
        console.log("✅ api-status.json 로드 완료:", apiStatusMap);
      }

      // 2단계: api-meta.json 로드 (성공하든 실패하든 다음 진행)
      return fetch("/swagger-status/api-meta.json")
        .then(res => res.json())
        .then(createdMap => {
          if (createdMap.status === 404 || createdMap.error) {
            console.error("❌ api-meta.json 로딩 실패:", createdMap);
          } else {
            apiCreatedDateMap = createdMap;
            console.log("✅ api-meta.json 로드 완료:", apiCreatedDateMap);
          }
        })
        .catch(err => {
          console.error("❌ api-meta.json 요청 자체 실패:", err);
        });
    })
    .catch(err => {
      console.error("❌ api-status.json 요청 자체 실패:", err);
    })
    .finally(() => {
      // 성공하든 실패하든 Swagger UI 초기화는 반드시 진행
      const ui = SwaggerUIBundle({
        url: "/v3/api-docs",
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout",
        onComplete: function () {
          console.log("✅ Swagger UI 로딩 완료");
          setTimeout(() => {
            highlightApiStatusFromDescription();  // 상태 강조
            highlightNewApisFromSpec();          // NEW 강조
            highlightNewModelsFromSpec();        // NEW 모델 강조
          }, 1000);
        }
      });

      window.ui = ui;
    });
};


// ✅ NEW Model 강조
function highlightNewModelsFromSpec() {
  const spec = window.ui.specSelectors.specJson().toJS();
  const schemas = spec.components?.schemas;
  if (!schemas) return;

  const now = new Date();
  const DAYS_THRESHOLD = 5;

  Object.entries(schemas).forEach(([schemaName, schemaContent]) => {
    // 🔍 class#method 기반이 아니라, 모델 이름 기반으로 매칭
    const candidates = Object.entries(apiCreatedDateMap)
      .filter(([fullKey]) => fullKey.endsWith(`#${schemaName}`));

    let classSchemaKey = null;
    let createdDate = null;

    if (candidates.length === 1) {
      [classSchemaKey, createdDate] = candidates[0];
    } else if (candidates.length > 1) {
      [classSchemaKey, createdDate] = candidates.find(([k]) => k.includes(schemaName)) || [];
    }

    if (!createdDate) return;

    const modelDate = new Date(createdDate);
    const diffDays = Math.floor((now - modelDate) / (1000 * 60 * 60 * 24));
    const isRecent = diffDays >= 0 && diffDays <= DAYS_THRESHOLD;

    if (isRecent) {
      const modelNodes = document.querySelectorAll(".model-container");

      modelNodes.forEach(node => {
        const label = node.querySelector(".model-title");
        if (label && label.textContent.trim() === schemaName) {
          const existingBadge = label.querySelector(".new-model-badge");
          if (!existingBadge) {
            const badge = document.createElement("span");
            badge.textContent = "NEW";
            badge.className = "new-model-badge";
            badge.style.backgroundColor = "#6F42C1";
            badge.style.color = "#fff";
            badge.style.padding = "2px 8px";
            badge.style.marginLeft = "8px";
            badge.style.borderRadius = "8px";
            badge.style.fontSize = "12px";
            badge.style.fontWeight = "bold";
            badge.style.display = "inline-block";

            label.appendChild(badge);
            console.log(`🎉 NEW 모델 뱃지 추가 완료: ${schemaName}`);
          }
        }
      });
    }
  });
}


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

function isApiSeenRecently(key, thresholdDays = 5) {
  const seenApis = getSeenApis();
  const seen = seenApis[key];
  if (!seen) return false; // 아예 본 적이 없는 경우 → 아직 강조 대상

  const saved = new Date(seen.timestamp);
  const now = new Date();
  const diffDays = (now - saved) / (1000 * 60 * 60 * 24);

  // 5일 이상 경과했다면 확인된 것으로 간주하고 localStorage에 기록
  if (diffDays >= thresholdDays) {
    console.log(`🕔 [AUTO CONFIRM] ${key} → ${diffDays.toFixed(1)}일 경과 → 자동 확인`);
    markApiAsSeen(key, seen.type); // 기존 type 유지하여 자동 등록
    return true; // 확인된 것으로 간주
  }

  return true; // 5일 이내 → 이미 확인된 상태
}

// ✅ NEW API 강조
function highlightNewApisFromSpec() {
  const spec = window.ui.specSelectors.specJson().toJS();
  const paths = spec.paths;
  const now = new Date();
  const DAYS_THRESHOLD = 5;

  Object.entries(paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const operationId = operation.operationId;
      const tags = operation.tags || [];
      const tag = tags[0];
      const key = `${method.toUpperCase()} ${path}`;

      // 🔍 class#method 포맷 기반 탐색
      const candidates = Object.entries(apiCreatedDateMap)
        .filter(([fullKey]) => fullKey.endsWith(`#${operationId}`));

      let classMethodKey = null;
      let createdDate = null;

      if (candidates.length === 1) {
        [classMethodKey, createdDate] = candidates[0];
      } else if (candidates.length > 1) {
        [classMethodKey, createdDate] = candidates.find(([k]) => k.includes(tag)) || [];
      }

      if (!createdDate) return;

      const apiDate = new Date(createdDate);
      const diffDays = Math.floor((now - apiDate) / (1000 * 60 * 60 * 24));
      const isRecent = diffDays >= 0 && diffDays <= DAYS_THRESHOLD;

//console.log("🔥 검사 대상:", {
//  path,
//  method,
//  operationId,
//  tags,
//  key,
//  classMethodKey,
//  createdDate,
//  apiDate: createdDate ? new Date(createdDate).toISOString() : null,
//  diffDays,
//  isRecent,
//  seenRecently: isApiSeenRecently(key)
//});

      if (isRecent && !isApiSeenRecently(key)) {
        const opblocks = document.querySelectorAll(`.opblock`);
        opblocks.forEach(opblock => {
          const elSummary = opblock.querySelector('.opblock-summary');
          const elPath = elSummary?.querySelector('.opblock-summary-path');
          const elMethod = elSummary?.querySelector('.opblock-summary-method');

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
              opblock.style.backgroundColor = '';
              opblock.style.borderLeft = '';
              opblock.style.boxShadow = '';
              const badge = opblock.querySelector(".new-api-badge");
              if (badge) badge.remove();
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

//      console.log(`🔍 [STATUS] key=${method.toUpperCase()} ${path}, emoji=${matchedEmoji}, status=${matchedStatus}`);
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
