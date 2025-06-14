import { loadSwagger } from "../../../custominit/init.js";

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

const findTestLi = document.querySelector(
  "#custom-api-tree > #custom-api-tree-main-test"
);

findTestLi.addEventListener("click", () => {
  loadSwagger();
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

export { clearLocalStorage, clearCookies, refreshPage };
