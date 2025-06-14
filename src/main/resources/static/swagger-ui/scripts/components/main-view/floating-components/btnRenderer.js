import "../../sidebar/handler.js";
import "../../modal/handlerModal.js";
import {
  clearLocalStorage,
  clearCookies,
  refreshPage,
} from "./btnHandler.js";

// 필요 시 전역으로도 노출
window.clearLocalStorage = clearLocalStorage;
window.clearCookies = clearCookies;
window.refreshPage = refreshPage;
