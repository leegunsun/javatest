window.onload = function () {
  const ui = SwaggerUIBundle({
    url: "/v3/api-docs",
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis],
    layout: "BaseLayout",
    onComplete: function () {
      console.log("✅ Swagger UI 로딩 완료");
      setTimeout(() => {
        highlightApiStatusFromDescription();
        highlightNewApisFromSpec(); // 기존 함수도 유지
      }, 1000);
    }
  });

  window.ui = ui;
};

  function getSeenApis() {
    const raw = localStorage.getItem("seenNewApis");
    return raw ? JSON.parse(raw) : [];
  }

  function markApiAsSeen(path, method) {
    const seen = getSeenApis();
    const key = `${method.toUpperCase()} ${path}`;
    if (!seen.includes(key)) {
      seen.push(key);
      localStorage.setItem("seenNewApis", JSON.stringify(seen));
    }
  }

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
        const isAlreadySeen = seenApis.includes(key);

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

              // 강조 스타일
              opblock.style.backgroundColor = '#f3e8fd'; // 연한 보라 배경
              opblock.style.borderLeft = '8px solid #6F42C1'; // 보라색 선
              opblock.style.boxShadow = '0 0 15px rgba(111, 66, 193, 0.5)';

              // NEW 뱃지
              const descWrapper = opblock.querySelector(".opblock-summary-description");
              if (descWrapper && !descWrapper.querySelector(".new-api-badge")) {
                const badge = document.createElement("span");
                badge.textContent = "NEW";
                badge.className = "new-api-badge";
                badge.style.backgroundColor = "#6F42C1"; // ✅ 보라색
                badge.style.color = "#fff";
                badge.style.padding = "2px 8px";
                badge.style.marginLeft = "8px";
                badge.style.borderRadius = "8px";
                badge.style.fontSize = "12px";
                badge.style.fontWeight = "bold";
                badge.style.display = "inline-block";

                descWrapper.appendChild(badge);
              }

              // ✅ 클릭 시 본 것으로 처리
              elSummary?.addEventListener("click", () => {
                markApiAsSeen(path, method);
                console.log(`👁️‍🗨️ API 확인 처리됨: ${key}`);

                opblock.style.backgroundColor = '';
                opblock.style.borderLeft = '';
                opblock.style.boxShadow = '';

                const badge = descWrapper?.querySelector(".new-api-badge");
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

  function highlightApiStatusFromDescription() {
    const spec = window.ui.specSelectors.specJson().toJS();
    const paths = spec.paths;

    Object.entries(paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        const description = operation.description || "";
        const summary = operation.summary || "";

        const statusList = [
          "작업중", "작업완료", "업데이트", "작업안함",
          "테스트중", "테스트완료", "테스트실패", "테스트성공"
        ];

        const matchedStatus = statusList.find(status => summary.includes(status));
        if (!matchedStatus) return;

        const opblocks = document.querySelectorAll(`.opblock`);
        opblocks.forEach(opblock => {
          const elSummary = opblock.querySelector('.opblock-summary');
          const elPath = elSummary?.querySelector('.opblock-summary-path');
          const elMethod = elSummary?.querySelector('.opblock-summary-method');

          const matchesPath = elPath?.textContent === path;
          const matchesMethod = elMethod?.textContent?.toLowerCase() === method;

          if (matchesPath && matchesMethod) {
            // CSS 클래스 추가
            opblock.classList.add(`status-${matchedStatus}`);

            // 상태 뱃지 삽입
            const descWrapper = elSummary.querySelector(".opblock-summary-description");
            if (descWrapper && !descWrapper.querySelector(`.badge-${matchedStatus}`)) {
              const badge = document.createElement("span");
              badge.textContent = matchedStatus;
              badge.className = `badge-${matchedStatus}`;
              descWrapper.appendChild(badge);
            }
          }
        });
      });
    });
  }
