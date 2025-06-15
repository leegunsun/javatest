import { pushConvertSpec, setRawSpec, getRawSpec } from "./state.js";
import { getLocalStorageUsedPath ,
   getLocalStorageInitDropDownBtn,
    setLocalStorageInitDropDownBtn } from "../swaggerInitData.js";

function filterPathsByUsedPath(originalSpec, usedPathList) {
  
  if (usedPathList == null) {
    return {
      ...originalSpec,
      tags: [],
      paths: [],
    };
  }

  const filteredPaths = {};
  const tagSet = new Set();

  Object.entries(originalSpec.paths).forEach(([path, methods]) => {
    const filteredMethods = {};

    Object.entries(methods).forEach(([method, operation]) => {
      const normalizedMethod = method.toLowerCase();
      const usedPath = path.split("/");

      // pushConvertSpec({
      //   rootTagName: operation.tags?.[0],
      //   subTagName: operation.operationId + usedPath[2],
      //   method,
      //   rootPath: usedPath[2],
      //   subPath: usedPath[3],
      // });

      const isMatch = usedPathList.some((entry) => {
        const targetMethod = entry.method.toLowerCase();
        const composedPath = `${entry.path}`.replace(
          /\/+/g,
          "/"
        );

        //   const composedPath = `/api/${entry.rootPath}/${entry.subPath}`.replace(
        //   /\/+/g,
        //   "/"
        // );

        return (
          normalizedMethod === targetMethod &&
          path === composedPath &&
          operation.tags?.includes(entry.tags?.[0])
        );
      });

      if (isMatch) {
        filteredMethods[method] = operation;
        operation.tags?.forEach((tag) => tagSet.add(tag));
      }
    });

    if (Object.keys(filteredMethods).length > 0) {
      filteredPaths[path] = filteredMethods;
    }
  });

  return {
    ...originalSpec,
    tags: [...tagSet].map((tag) => ({ name: tag })),
    paths: filteredPaths,
  };
}

export function initDropDownBtn() {
  const selectElement2 = document.getElementById("servers");
  if (selectElement2) {
    console.log("✅ 드롭다운 요소 탐지됨");

    // 리스너 등록 및 초기화
    selectElement2.addEventListener("change", () => {
      setLocalStorageInitDropDownBtn(selectElement2.value)
    });

    const savedUrl = getLocalStorageInitDropDownBtn();
    console.log(savedUrl);
    if (savedUrl) {
      selectElement2.value = savedUrl;
      selectElement2.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  const getUrlState = getLocalStorageInitDropDownBtn();

  if (getUrlState == null) {
    console.warn("⚠️ 'initDropDownBtn'가 존재하지 않습니다.");
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
}

/**
 *
 * [code flow]
 *
 * 설정에서 선택한 API가 {@code localStorage.getItem("usedPath")}에 존재합니다.
 * 아래와 같은 흐름으로 선택 API만 스웨거에 나타냅니다.
 *
 * 1. 서버에서 전체 데이터를 불러옵니다.
 * 2. 가져온 전체 데이터중에 사용자가 선택한 데이터만 사용합니다.
 *
 * @returns
 */
export async function loadFilteredSwaggerSpec() {
  const swaggerUrl = `/v3/api-docs/1`;
  const getData = await fetch(swaggerUrl).then((res) => res.json());

  const usedPath = JSON.parse(getLocalStorageUsedPath());

  setRawSpec(structuredClone(getData));
  const filteredSpec = filterPathsByUsedPath(getRawSpec(), usedPath);

  return filteredSpec;
}
