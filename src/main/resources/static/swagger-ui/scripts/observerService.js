import { swaggerUiObserver, setSwaggerUiObserver } from './state.js';
import { highlightApiStatusFromDescription } from './statusHighlighter.js';
import { highlightNewApisFromSpec }          from './newApiHighlighter.js';


// ✅ NEW Model 강조
export function observeModelsAndHighlight() {
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

export function observeApiExpandCollapse() {
  if (swaggerUiObserver) {
    swaggerUiObserver.disconnect();
    setSwaggerUiObserver(null);
    console.log("✅ 이전 Swagger UI Observer 해제 완료");
  }

  const observer = new MutationObserver((mutationsList, obs) => {
    console.log("🔄 API 블록 변화 감지됨");

    obs.disconnect();  // ✅ 현재 감시 해제
    setSwaggerUiObserver(null);

    highlightApiStatusFromDescription();
    highlightNewApisFromSpec();

  });

  setSwaggerUiObserver(observer);
  observer.observe(document.getElementById('swagger-ui'), { childList: true, subtree: true });
  console.log("✅ 새로운 Swagger UI Observer 등록 완료");
}


