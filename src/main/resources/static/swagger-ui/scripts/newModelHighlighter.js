import { apiCreatedDateMap } from './state.js';

export function highlightNewModelsFromSpec() {
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