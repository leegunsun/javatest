import { highlightApiStatusFromDescription } from "../components/main-view/highlighters/state/statusApiHighlighter.js"
import { addApiPrefixToDescription } from "../components/main-view/descriptionRenderer.js";
import { loadFilteredSwaggerSpec , initDropDownBtn } from "./swaggerPostProcessors.js";
import { highlightNewApisFromSpec } from "../components/main-view/highlighters/newApi/newApiHighlighter.js"
import { highlightAll } from "../components/main-view/highlighters/init/highlightAllEnhancers.js";
/**
 *
 * - 그룹네임이 있다면 해당 그룹에 해당하는 스웨거 API를 호출해서 데이터를 불러옵니다.
 * - 그룹네임이 없다면 '커스텀 API 그룹'으로 인식해서 커스텀 API 리스트를 불러옵니다.
 *
 * @param groupName
 * @returns
 */
export async function loadSwagger(groupName) {
  const spec =
    groupName == null
      ? await loadFilteredSwaggerSpec()
      : await fetch(`/v3/api-docs/${groupName}`).then((res) => res.json());

  const ui = createSwaggerUI(spec);
  window.ui = ui;
  return ui;
}

function createSwaggerUI(spec) {
  return SwaggerUIBundle({
    spec,
    dom_id: "#swagger-ui",
    presets: [SwaggerUIBundle.presets.apis],
    layout: "BaseLayout",
    defaultModelsExpandDepth: 0,
    onComplete: () => {
      setTimeout(() => {
        initDropDownBtn();
        highlightAll();
        addApiPrefixToDescription();
      }, 1000);
    },
  });
}
