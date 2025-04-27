let apiStatusMap = {};
let apiCreatedDateMap = {};

window.onload = function () {
  fetch("/swagger-status/api-status.json")
    .then(res => res.json())
    .then(statusMap => {
      if (statusMap.status === 404 || statusMap.error) {
        console.error("❌ api-status.json 로딩 실패:", statusMap);
      } else {
        apiStatusMap = statusMap;
        console.log("✅ api-status.json 로드 완료:", apiStatusMap);
      }

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
          console.error("❌ api-meta.json 요청 실패:", err);
        });
    })
    .catch(err => {
      console.error("❌ api-status.json 요청 실패:", err);
    })
    .finally(() => {
      const ui = SwaggerUIBundle({
        url: "/v3/api-docs",
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout",
        onComplete: function () {
          console.log("✅ Swagger UI 로딩 완료");
          setTimeout(() => {
            observeModelsAndHighlight();
            observeApiExpandCollapse();
            highlightNewControllersFromMeta();
          }, 1000);
        }
      });
      window.ui = ui;
    });
};

// ✅ NEW Controller 강조
function highlightNewControllersFromMeta() {
  console.log("🛠️ highlightNewControllersFromMeta() 호출됨");

  const now = new Date();
  const DAYS_THRESHOLD = 5;
  const seenApis = getSeenApis();

  const spec = window.ui.specSelectors.specJson().toJS();
  const paths = spec.paths;

  const controllerTagMap = {};

  // ✅ operationId → method, path 매핑
  Object.entries(apiCreatedDateMap).forEach(([controllerFullName, controllerData]) => {
    const tagName = controllerData.tag?.name;
    if (!tagName || !controllerData.methods) return;

    const dates = Object.values(controllerData.methods).map(method => method.date);

    const operationIdMap = [];

    Object.keys(controllerData.methods).forEach(operationId => {
      outer: for (const [path, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          if (operation.operationId === operationId) {
            operationIdMap.push({
              operationId,
              method: method.toUpperCase(),
              path
            });
            break outer;
          }
        }
      }
    });

    controllerTagMap[tagName.toLowerCase()] = { dates, operationIdMap };
  });

  // ✅ NEW 컨트롤러 뱃지 붙이거나 제거
  const tagElements = document.querySelectorAll('.opblock-tag-section');
  tagElements.forEach(section => {
    const tagHeader = section.querySelector('.opblock-tag');
    const tagNameSpan = tagHeader?.querySelector('span');
    const tagName = tagNameSpan?.textContent.trim();

    if (!tagName) return;

    const data = controllerTagMap[tagName.toLowerCase()];
    if (!data) {
      console.log(`❓ ${tagName}에 대한 데이터 없음`);
      return;
    }

    const { dates, operationIdMap } = data;

    // 🔥 최근 5일 이내 API 존재하는가?
    const hasRecent = dates.some(dateStr => {
      const createdDate = new Date(dateStr);
      const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= DAYS_THRESHOLD;
    });

    if (!hasRecent) {
      const existingBadge = tagHeader.querySelector(".new-controller-badge");
      if (existingBadge) {
        existingBadge.remove();
        console.log(`🧹 [컨트롤러 제거 - 최근 없음] ${tagName}`);
      }
      return;
    }

    // 🔥 모든 하위 API가 seen 되었는가?
    const allApisSeen = operationIdMap.every(({ method, path }) => {
      const key = `${method} ${path}`;
      const seen = seenApis[key];
      console.log(`[검사] ${key}: ${seen ? '✅ 확인됨' : '❌ 미확인'}`);
      return seen;
    });

    if (allApisSeen) {
      const existingBadge = tagHeader.querySelector(".new-controller-badge");
      if (existingBadge) {
        existingBadge.remove();
        console.log(`🧹 [컨트롤러 제거 - 모두 확인] ${tagName}`);
      }
      return;
    }

    // 🔥 NEW 뱃지가 없으면 추가
    const existingBadge = tagHeader.querySelector(".new-controller-badge");
    if (!existingBadge) {
      const badge = document.createElement("span");
      badge.textContent = "NEW";
      badge.className = "new-controller-badge";
      badge.style.cssText = "background:#6F42C1;color:white;padding:2px 8px;margin-left:8px;border-radius:8px;font-size:12px;font-weight:bold;display:inline-block;";
      tagNameSpan.parentElement.appendChild(badge);
      console.log(`🎉 NEW 컨트롤러 뱃지 추가 완료: ${tagName}`);
    }
  });
}


// ✅ NEW API 강조
function highlightNewApisFromSpec() {
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
        const opblocks = document.querySelectorAll(".opblock");
        opblocks.forEach(opblock => {
          const elSummary = opblock.querySelector(".opblock-summary");
          const elPath = elSummary?.querySelector(".opblock-summary-path");
          const elMethod = elSummary?.querySelector(".opblock-summary-method");

          if (elPath?.textContent === path && elMethod?.textContent?.toLowerCase() === method) {
            const descWrapper = elSummary.querySelector(".opblock-summary-description");
            if (descWrapper && !descWrapper.querySelector(".new-api-badge")) {
              const badge = document.createElement("span");
              badge.textContent = "NEW";
              badge.className = "new-api-badge";
              badge.style.cssText = "background:#6F42C1;color:white;padding:2px 8px;margin-left:8px;border-radius:8px;font-size:12px;font-weight:bold;display:inline-block;";
              descWrapper.appendChild(badge);

              elSummary.addEventListener("click", () => {
                markApiAsSeen(key, "new");
                opblock.style.backgroundColor = '';
                opblock.style.borderLeft = '';
                opblock.style.boxShadow = '';
                const badge = descWrapper.querySelector(".new-api-badge");
                if (badge) badge.remove();
              }, { once: true }); // ✅ 클릭 이벤트는 한 번만
            }
          }
        });
      }
    });
  });
}


// ✅ NEW Model 강조
function observeModelsAndHighlight() {
  const observer = new MutationObserver(() => {
    const modelNodes = document.querySelectorAll(".model-container");
    if (modelNodes.length > 0) {
      console.log("✅ 모델 등장 감지 완료");
      highlightNewModelsFromSpec();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function highlightNewModelsFromSpec() {
  const spec = window.ui.specSelectors.specJson().toJS();
  const schemas = spec.components?.schemas;
  const now = new Date();
  const DAYS_THRESHOLD = 5;

  Object.entries(schemas).forEach(([schemaName]) => {
    let dates = [];

    Object.entries(apiCreatedDateMap).forEach(([controllerFullName, controllerData]) => {
      if (controllerData.methods && controllerData.methods[schemaName]) {
        dates.push(controllerData.methods[schemaName].date);
      }
    });

    if (dates.length === 0) return;

    const isRecent = dates.some(dateStr => {
      const modelDate = new Date(dateStr);
      const diffDays = (now - modelDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= DAYS_THRESHOLD;
    });

    if (isRecent) {
      const modelNodes = document.querySelectorAll(".model-container");
      modelNodes.forEach(node => {
        const label = node.querySelector(".model-title");
        if (label?.textContent.trim() === schemaName) {
          const badge = document.createElement("span");
          badge.textContent = "NEW";
          badge.className = "new-model-badge";
          badge.style.cssText = "background:#6F42C1;color:white;padding:2px 8px;margin-left:8px;border-radius:8px;font-size:12px;font-weight:bold;display:inline-block;";
          label.appendChild(badge);
          console.log(`🎉 NEW 모델 뱃지 추가 완료: ${schemaName}`);
        }
      });
    }
  });
}

// ✅ 이하 observeApiExpandCollapse, highlightApiStatusFromDescription, seenApis 관리는 동일하게 유지
function observeApiExpandCollapse() {
  const observer = new MutationObserver(() => {
    console.log("🔄 API 블록 변화 감지됨");

    observer.disconnect(); // ✅ 변화 감지 멈춤

    try {
      highlightApiStatusFromDescription();
      highlightNewApisFromSpec();
      highlightNewControllersFromMeta(); // ✅ 추가
    } finally {
      observer.observe(document.getElementById('swagger-ui'), { childList: true, subtree: true }); // ✅ 다시 감시 시작
    }
  });

  observer.observe(document.getElementById('swagger-ui'), { childList: true, subtree: true });
}

// ✅ 상태별 강조
function highlightApiStatusFromDescription() {
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

        if (elPath?.textContent === path && elMethod?.textContent?.toLowerCase() === method) {
          const descWrapper = elSummary.querySelector(".opblock-summary-description");
          if (descWrapper && !descWrapper.querySelector(`.badge-${matchedStatus}`)) {
            const badge = document.createElement("span");
            badge.textContent = matchedStatus;
            badge.className = `badge-${matchedStatus}`;
            badge.dataset.status = matchedStatus;
            badge.style.marginRight = "8px";
            descWrapper.appendChild(badge);

            elSummary.addEventListener("click", () => {
              markApiAsSeen(key, "status");
              const badge = descWrapper.querySelector(`.badge-${matchedStatus}`);
              if (badge) badge.remove();
              opblock.className = opblock.className.split(' ').filter(c => !c.startsWith('status-')).join(' ');
            }, { once: true }); // ✅ 클릭 이벤트는 한 번만
          }
        }
      });
    });
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
  if (!seen) return false;

  const saved = new Date(seen.timestamp);
  const now = new Date();
  const diffDays = (now - saved) / (1000 * 60 * 60 * 24);

  if (diffDays >= thresholdDays) {
    markApiAsSeen(key, seen.type);
    return true;
  }
  return true;
}
