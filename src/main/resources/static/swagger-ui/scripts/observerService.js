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
    swaggerUiObserver = null;
    console.log("✅ 이전 Swagger UI Observer 해제 완료");
  }

  const observer = new MutationObserver(() => {
    console.log("🔄 API 블록 변화 감지됨");

    swaggerUiObserver.disconnect(); // 일단 끊고
    setSwaggerUiObserver(null);        // observer null로 초기화

    try {
      highlightApiStatusFromDescription();
      highlightNewApisFromSpec();
    } finally {
      // 다시 연결
      const newObs = new MutationObserver(() => {
        console.log("🔄 API 블록 변화 감지됨");
      if (swaggerUiObserver) {
        swaggerUiObserver.disconnect();
        setSwaggerUiObserver(null);
      }
        highlightApiStatusFromDescription();
        highlightNewApisFromSpec();
      });
      setSwaggerUiObserver(newObs);

      newObs.observe(document.getElementById('swagger-ui'), { childList: true, subtree: true });
    }
  });

  setSwaggerUiObserver(observer);
  observer.observe(document.getElementById('swagger-ui'), { childList: true, subtree: true });
  console.log("✅ 새로운 Swagger UI Observer 등록 완료");
}
