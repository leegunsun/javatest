window.onload = function () {
  console.log("✅ swagger-custom.js 로딩됨");

  const ui = SwaggerUIBundle({
    url: "/v3/api-docs",
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis],
    layout: "BaseLayout",
    onComplete: function () {
      highlightNewApis();
    }
  });

  function highlightNewApis() {
    setTimeout(() => {
      const DAYS_THRESHOLD = 7;
      const now = new Date();

      document.querySelectorAll('.opblock-summary-description').forEach(el => {
        const text = el.innerText || "";

        // 조건 1: 이모지 직접 포함 or "2025-04" 문자열 포함
        const hasNewTag = text.includes("🆕") || text.includes("2025-04");

        // 조건 2: 날짜 자동 추출 후 판단
        let isRecentDate = false;
        const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          const apiDate = new Date(dateMatch[0]);
          const diff = Math.ceil((now - apiDate) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff <= DAYS_THRESHOLD) {
            isRecentDate = true;
          }
        }

        if (hasNewTag || isRecentDate) {
          const parentOpBlock = el.closest('.opblock');
          if (parentOpBlock) {
            parentOpBlock.style.backgroundColor = '#ffeeba';
            parentOpBlock.style.borderLeft = '8px solid #dc3545';
            parentOpBlock.style.boxShadow = '0 0 15px rgba(220, 53, 69, 0.7)';
            parentOpBlock.style.transition = 'all 0.3s ease-in-out';
          }

          // 배지 중복 삽입 방지
          if (!el.querySelector(".new-api-badge")) {
            const badge = document.createElement("span");
            badge.textContent = "🆕 NEW";
            badge.className = "new-api-badge";
            badge.style.backgroundColor = "#dc3545";
            badge.style.color = "#fff";
            badge.style.padding = "2px 8px";
            badge.style.marginLeft = "8px";
            badge.style.borderRadius = "8px";
            badge.style.fontSize = "12px";
            badge.style.fontWeight = "bold";

            el.appendChild(badge);
          }
        }
      });
    }, 1000);
  }

  window.ui = ui;
};
