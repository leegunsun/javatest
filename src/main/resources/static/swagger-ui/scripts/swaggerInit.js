import { highlightApiStatusFromDescription } from "./statusHighlighter.js";
import { highlightNewApisFromSpec } from "./newApiHighlighter.js";
import {
  observeModelsAndHighlight,
  observeApiExpandCollapse,
} from "./observerService.js";

export function loadSwagger(groupName) {
  const swaggerUrl = `/v3/api-docs/${groupName}`;
  const ui = SwaggerUIBundle({
    url: swaggerUrl,
    dom_id: "#swagger-ui",
    presets: [SwaggerUIBundle.presets.apis],
    layout: "BaseLayout",
    defaultModelsExpandDepth: 0,
    onComplete: () => {
      console.log(`✅ Swagger UI [${groupName}] 로딩 완료`);
      setTimeout(() => {
        const selectElement2 = document.getElementById("servers");
        if (selectElement2) {
          console.log("✅ 드롭다운 요소 탐지됨");

          // 리스너 등록 및 초기화
          selectElement2.addEventListener("change", () => {
            localStorage.setItem("urlState", selectElement2.value);
          });

          const savedUrl = localStorage.getItem("urlState");
          console.log(savedUrl);
          if (savedUrl) {
            selectElement2.value = savedUrl;
            selectElement2.dispatchEvent(
              new Event("change", { bubbles: true })
            );
          }
        }

        console.log(`✅ Swagger UI [${groupName}] 로딩 완료`);

        const getUrlState = localStorage.getItem("urlState");

        if (getUrlState == null) {
          console.warn("⚠️ 'getUrlState'가 존재하지 않습니다.");
          return;
        }

        const selectElement = document.getElementById("servers");
        selectElement.value = getUrlState;

        const event = new Event("change", { bubbles: true });
        const dispatched = selectElement.dispatchEvent(event);
        console.log("📣 change 이벤트 디스패치 완료. 성공 여부:", dispatched);

        observeModelsAndHighlight();
        observeApiExpandCollapse();
        highlightApiStatusFromDescription();
        highlightNewApisFromSpec();
      }, 1000);
    },
  });

  window.ui = ui;
  return ui; // ← 반환 추가
}
