/**
 * LocalStorage 초기화
 */
function clearLocalStorage() {
  if (confirm("정말로 LocalStorage를 초기화하시겠습니까?")) {
    localStorage.clear();
    alert("LocalStorage가 초기화되었습니다. 페이지를 새로고침합니다.");
    location.reload();
  }
}

/**
 * 모든 쿠키 삭제
 */
function clearCookies() {
  if (confirm("정말로 모든 쿠키를 초기화하시겠습니까?")) {
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name =
        eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    alert("쿠키가 초기화되었습니다. 페이지를 새로고침합니다.");
    location.reload();
  }
}

/**
 * 페이지 새로고침
 */
function refreshPage() {
  location.reload();
}

const toggleBtn = document.getElementById("toggle-sidebar-btn");
const sidebar = document.querySelector(".sidebar");
const swaggerUi = document.getElementById("swagger-ui");

let isCollapsed = false;

toggleBtn.addEventListener("click", () => {
  isCollapsed = !isCollapsed;

  if (isCollapsed) {
    sidebar.classList.add("collapsed");
    swaggerUi.classList.add("sidebar-collapsed");
    toggleBtn.innerText = "☰"; // 펼치기
  } else {
    sidebar.classList.remove("collapsed");
    swaggerUi.classList.remove("sidebar-collapsed");
    toggleBtn.innerText = "←"; // 접기
  }
});

const serverDropDownTest = document.getElementById("toggle-server-test-btn");

serverDropDownTest.addEventListener("click", () => {
  const selectElement = document.getElementById("servers");
  const newUrl = "http://localhost:8082";

  console.log("🔍 이전 선택값:", selectElement.value);

  // 1. 드롭다운 값 변경
  selectElement.value = newUrl;
  console.log("✅ 드롭다운 값을 변경했습니다:", selectElement.value);

  // 2. change 이벤트 발생
  const event = new Event("change", { bubbles: true });
  const dispatched = selectElement.dispatchEvent(event);
  console.log("📣 change 이벤트 디스패치 완료. 성공 여부:", dispatched);

  // 3. 상태 확인
  setTimeout(() => {
    try {
      const fullState = window.ui.getSystem().getState().toJS();
      console.log("🧩 전체 상태 트리:", fullState);

      const currentDomValue = document.getElementById("servers")?.value;
      console.log("🌐 현재 선택된 서버 URL (DOM 기준):", currentDomValue);
    } catch (e) {
      console.warn("⚠️ 상태 확인 실패:", e);
    }
  }, 500);
});

// 버튼에 이벤트 핸들러 바인딩
document
  .getElementById("refresh-page-btn")
  .addEventListener("click", refreshPage);

document
  .getElementById("reset-localstorage-btn")
  .addEventListener("click", clearLocalStorage);

document
  .getElementById("reset-cookie-btn")
  .addEventListener("click", clearCookies);

// 필요 시 전역으로도 노출
window.clearLocalStorage = clearLocalStorage;
window.clearCookies = clearCookies;
window.refreshPage = refreshPage;
