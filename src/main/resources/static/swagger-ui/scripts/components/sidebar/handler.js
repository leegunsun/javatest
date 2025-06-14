import { toggleIsCollapsed } from "./state.js";
import { toggleBtn, sidebar, swaggerUi } from "./selectors.js";


/**
 * 사이드바 토글 버튼 클릭 이벤트 핸들러
 */
toggleBtn.addEventListener("click", () => {
  const collapsedNow = toggleIsCollapsed();

  if (collapsedNow) {
    sidebar.classList.add("collapsed");
    swaggerUi.classList.add("sidebar-collapsed");
    toggleBtn.innerText = "☰"; // 펼치기
  } else {
    sidebar.classList.remove("collapsed");
    swaggerUi.classList.remove("sidebar-collapsed");
    toggleBtn.innerText = "←"; // 접기
  }
});
