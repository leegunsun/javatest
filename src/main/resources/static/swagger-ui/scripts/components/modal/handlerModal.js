import { renderCategoryList } from "./renderCategoryList.js";
import { loadFilteredSwaggerSpec } from "../../custominit/swaggerPostProcessors.js";
import { getConvertSpec } from "../../custominit/state.js";
import { loadSwagger } from "../../custominit/init.js";
import { setLocalStorageUsedPath, getLocalStorageUsedPath } from "../../swaggerInitData.js";

// [1] 설정 버튼 클릭 → 모달 열기
document.getElementById("settings-btn").addEventListener("click", async () => {
  await loadFilteredSwaggerSpec();

  // 여기에 리스트 생성하기
  openModal();
});

// [3] 오버레이(배경) 클릭 → 모달 닫기 (단, 모달 본문 클릭 제외)
document.getElementById("modal-overlay").addEventListener("click", (event) => {
  console.log("[🖱️ modal-overlay] 클릭 발생");
  console.log("  ➤ event.target.id:", event.target.id);
  console.log("  ➤ event.currentTarget.id:", event.currentTarget.id);
  console.log(
    "  ➤ target === currentTarget ?",
    event.target === event.currentTarget
  );

  if (event.target === event.currentTarget) {
    console.log("  ✅ 배경 클릭으로 간주 → 닫기 수행");
    closeModal();
  } else {
    console.log("  ⛔ 모달 본문 클릭 → 닫기 무시");
  }
});


/**
 * 모달을 열면서 필요한 아이템 리스트들을 채워넣습니다.
 */
function openModal() {
  console.log("[🔓 openModal] 모달 열기 시도");
  renderCategoryList(getLocalStorageUsedPath());
  document.getElementById("modal-overlay")?.classList.remove("hidden");
}

function closeModal() {
  console.log("[🔒 closeModal] 모달 닫기 시도");
  document.getElementById("modal-overlay")?.classList.add("hidden");
}

// [2] 닫기 버튼 클릭 → 모달 닫기
document.getElementById("closed-modal").addEventListener("click", () => {
  console.log("[❌ closed-modal] 닫기 버튼 클릭됨");
  closeModal();
});

document.getElementById("save-modal").addEventListener("click", () => {
  setLocalStorageUsedPath(JSON.stringify(getConvertSpec()));
  closeModal();
  loadSwagger();
});
