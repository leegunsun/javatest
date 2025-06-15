import { renderSubcategoryItems } from "./renderSubcategories.js";
import { getTagContainer, getSubContainer } from "./selectors.js";
import { getRawSpec, pushConvertSpec } from "../../custominit/state.js";

export function renderCategoryList(selectedRootTagName) {
  const tagContainer = getTagContainer();
  const subContainer = getSubContainer();
  const rawSpec = getRawSpec();
  var categoryItemList = [];

  // ────────────────────────────────────────────────────
  // 1) 중복 방지: 호출될 때마다 기존 버튼·서브컨테이너 초기화
  tagContainer.innerHTML = "";
  subContainer.innerHTML = "";
  // ────────────────────────────────────────────────────

  // 2) 모든 경로·메서드를 펼친 리스트
  const operationsList = Object.entries(rawSpec.paths)
    .flatMap(([path, methods]) =>
      Object.entries(methods).map(([method, op]) => ({ path, method, ...op }))
    );

  // 3) 고유한 태그 목록 추출
  const uniqueRootTags = [
    ...new Set(
      operationsList
        .map(op => op.tags?.[0])
        .filter(tag => Boolean(tag))
    )
  ];

  // 4) 태그별 버튼 생성 및 이벤트 바인딩
  uniqueRootTags.forEach(rootTagName => {
    const tagItem = document.createElement("div");
    tagItem.textContent = rootTagName;
    tagItem.dataset.rootTagName = rootTagName;
    tagItem.classList.add("selectCategory");
    tagItem.style.cursor = "pointer";

    tagItem.addEventListener("click", () => {
      highlightSelectedRootCategory(rootTagName);
      const subItems = operationsList.filter(item => item.tags[0] === rootTagName);
      renderSubcategoryItems(subItems, subContainer);
    });

    tagContainer.appendChild(tagItem);
  });

  // 5) 초기 선택 상태 처리
  if (selectedRootTagName) {
    const initial = [...tagContainer.children].find(
      el => el.dataset.rootTagName === selectedRootTagName
    );
    initial?.click();
  }
}


function highlightSelectedRootCategory(id) {
  const allCategories = document.querySelectorAll(
    ".modal-left#category-list > div"
  );
  allCategories.forEach(el => {
    el.classList.toggle("selectCategory-disabled",
      el.dataset.rootTagName === id
    );
  });
}
