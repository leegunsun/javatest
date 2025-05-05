import {
  highlightApiStatusFromDescription
} from './statusHighlighter.js';
import {
  highlightNewApisFromSpec
} from './newApiHighlighter.js';
import {
  observeModelsAndHighlight,
  observeApiExpandCollapse
} from './observerService.js';

export function loadSwagger(groupName) {
  const swaggerUrl = `/v3/api-docs/${groupName}`;
  const ui = SwaggerUIBundle({
    url: swaggerUrl,
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis],
    layout: "BaseLayout",
    defaultModelsExpandDepth: 0,
    onComplete: () => {
      console.log(`✅ Swagger UI [${groupName}] 로딩 완료`);
      setTimeout(() => {
        observeModelsAndHighlight();
        observeApiExpandCollapse();
        highlightApiStatusFromDescription();
        highlightNewApisFromSpec();
      }, 1000);
    }
  });

  window.ui = ui;
  return ui;   // ← 반환 추가
}