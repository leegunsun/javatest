import { highlightApiStatusFromDescription } from "./statusHighlighter.js";
import { highlightNewApisFromSpec } from "./newApiHighlighter.js";
import {
  observeModelsAndHighlight,
  observeApiExpandCollapse,
} from "./observerService.js";

export var rawSpec = [];
export var convertSpec = [];

export async function loadSwagger2() {
  const swaggerUrl = `/v3/api-docs/1`;
  const getData = await fetch(swaggerUrl).then((res) => res.json());

  // ✅ 여기서 필터링 수행

  const usedPath = JSON.parse(localStorage.getItem("usedPath"));
  

  const filteredSpec = filterPathsByUsedPath(
    structuredClone(getData),
    usedPath
  );
  const ui = SwaggerUIBundle({
    spec: filteredSpec,
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
        if (selectElement) {
          selectElement.value = getUrlState;

          const event = new Event("change", { bubbles: true });
          const dispatched = selectElement.dispatchEvent(event);
          console.log("📣 change 이벤트 디스패치 완료. 성공 여부:", dispatched);
        } else {
          console.warn("⚠️ select#servers 요소가 존재하지 않음 → 건너뜀");
        }

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

export async function loadSwagger(groupName) {
  const swaggerUrl = `/v3/api-docs/${groupName}`;
  const getData = await fetch(swaggerUrl).then((res) => res.json());

  // ✅ 여기서 필터링 수행

  const usedPath = [
    {
      rootTagName: "todos",
      method: "Get",
      rootPath: "todo",
      subPath: "{id}",
      subTagName : ""
    },
    {
      rootTagName: "userController",
      method: "Get",
      rootPath: "users",
      subPath: "{id}",
      subTagName : ""
    },
  ];

  const filteredSpec = filterPathsByUsedPath(
    structuredClone(getData),
    usedPath
  );
  const ui = SwaggerUIBundle({
    spec: filteredSpec,
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
        if (selectElement) {
          selectElement.value = getUrlState;

          const event = new Event("change", { bubbles: true });
          const dispatched = selectElement.dispatchEvent(event);
          console.log("📣 change 이벤트 디스패치 완료. 성공 여부:", dispatched);
        } else {
          console.warn("⚠️ select#servers 요소가 존재하지 않음 → 건너뜀");
        }

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

function filterPathsByUsedPath(originalSpec, usedPathList) {
  rawSpec = [];

  const filteredPaths = Object.entries(originalSpec.paths)
    .map(([path, methods]) => {
      const filteredMethods = Object.entries(methods)
        .filter(([method, operation]) => {
          const normalizedMethod = method.toLowerCase();
          const usedPath = path.split("/");

          rawSpec.push({
            "rootTagName": operation.tags[0],
            "subTagName": operation.operationId + usedPath[2],
            "method": method,
            "rootPath": usedPath[1],
            "subPath": usedPath[2],
          });

          return usedPathList.some((entry) => {
            const targetMethod = entry.method.toLowerCase();
            const composedPath = `/${entry.rootPath}/${entry.subPath}`.replace(
              /\/+/g,
              "/"
            );

            const hasTag = operation.tags?.includes(entry.rootTagName);

            return (
              normalizedMethod === targetMethod &&
              path === composedPath &&
              hasTag
            );
          });
        })
        .reduce((acc, [method, op]) => ({ ...acc, [method]: op }), {});

      return Object.keys(filteredMethods).length > 0
        ? [path, filteredMethods]
        : null;
    })
    .filter(Boolean) // null 제거
    .reduce((acc, [path, methods]) => ({ ...acc, [path]: methods }), {});

  return {
    ...originalSpec,
    paths: filteredPaths,
  };
}
