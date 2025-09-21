import { convertSpec, loadSwagger, loadFilteredSwaggerSpec } from "./swaggerInit.js";
import { selectCategory, addToSelection } from "./treeModule.js";


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
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name  = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
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


/**
 * 사이드바
 */
const toggleBtn = document.getElementById("toggle-sidebar-btn");
const sidebar = document.querySelector(".sidebar");
const swaggerUi = document.getElementById("swagger-ui");

let isCollapsed = false;


/**
 * 사이드바 토글 버튼 클릭 이벤트 핸들러
 */
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

/**
 * 모달을 열면서 필요한 아이템 리스트들을 채워넣습니다.
 */
function openModal() {
  console.log("[🔓 openModal] 모달 열기 시도");
  selectCategory();

  // ✅ 이전 북마크 복원 (localStorage에 저장된 값 기반)
  const saved = localStorage.getItem("usedPath");
  if (saved) {
    try {
      const savedItems = JSON.parse(saved);
      savedItems.forEach(item => {
        addToSelection(item); // 🧠 이미 존재하는 항목은 내부에서 무시되므로 안전
      });
    } catch (err) {
      console.warn("📛 저장된 북마크 데이터를 불러오는 데 실패했습니다.", err);
    }
  }

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
document
  .getElementById("closed-modal")
  .addEventListener("click", () => {
  console.log("[❌ closed-modal] 닫기 버튼 클릭됨");
  closeModal();
});

document
  .getElementById("save-modal")
  .addEventListener("click", () => {
  localStorage.setItem("usedPath", JSON.stringify(convertSpec));
  closeModal();
  loadSwagger();
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
 document.getElementById("settings-btn").addEventListener("click", async () => {
   await loadFilteredSwaggerSpec();

   // 여기에 리스트 생성하기
   openModal();
 });

// 필요 시 전역으로도 노출
window.clearLocalStorage = clearLocalStorage;
window.clearCookies      = clearCookies;
window.refreshPage       = refreshPage;
