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

function openModal() {
  console.log("[🔓 openModal] 모달 열기 시도");
  document.getElementById("modal-overlay")?.classList.remove("hidden");
}

function closeModal() {
  console.log("[🔒 closeModal] 모달 닫기 시도");
  document.getElementById("modal-overlay")?.classList.add("hidden");
}

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

// [2] 닫기 버튼 클릭 → 모달 닫기
document.getElementById("closed-modal").addEventListener("click", () => {
  console.log("[❌ closed-modal] 닫기 버튼 클릭됨");
  closeModal();
});

// [3] 오버레이(배경) 클릭 → 모달 닫기 (단, 모달 본문 클릭 제외)
document.getElementById("modal-overlay").addEventListener("click", (event) => {
  console.log("[🖱️ modal-overlay] 클릭 발생");
  console.log("  ➤ event.target.id:", event.target.id);
  console.log("  ➤ event.currentTarget.id:", event.currentTarget.id);
  console.log("  ➤ target === currentTarget ?", event.target === event.currentTarget);

  if (event.target === event.currentTarget) {
    console.log("  ✅ 배경 클릭으로 간주 → 닫기 수행");
    closeModal();
  } else {
    console.log("  ⛔ 모달 본문 클릭 → 닫기 무시");
  }
});

// [1] 설정 버튼 클릭 → 모달 열기
document.getElementById("settings-btn").addEventListener("click", () => {
  console.log("[⚙️ settings-btn] 설정 버튼 클릭됨");
  openModal();
});

// 필요 시 전역으로도 노출
window.clearLocalStorage = clearLocalStorage;
window.clearCookies = clearCookies;
window.refreshPage = refreshPage;
