import { apiStatusMap } from './state.js';
import { isApiSeenRecently, markApiAsSeen } from './storageService.js';

//import { getAuthorByOperationId } from './descriptionPrefixer.js';

// ✅ 상태별 강조
export function highlightApiStatusFromDescription() {
  console.log("🧹 highlightApiStatusFromDescription - 기존 상태 강조 초기화");

  // 1. 상태 초기화
  document.querySelectorAll(".opblock").forEach(opblock => {
//    opblock.className = opblock.className.split(' ').filter(c => !c.startsWith('status-')).join(' ');
    const descWrapper = opblock.querySelector('.opblock-summary-description');
    if (descWrapper) {
      descWrapper.querySelectorAll("span[class^='badge-']").forEach(badge => badge.remove());
    }
    // ✅ 북마크도 중복 생성 방지를 위해 초기화
    const oldBookmark = opblock.querySelector('.bookmark-toggle');
    if (oldBookmark) oldBookmark.remove();
  });

  const spec = window.ui.specSelectors.specJson().toJS();
  const paths = spec.paths;
  const emojiToTextMap = Object.fromEntries(Object.entries(apiStatusMap));
  const dismissibleStatuses = ["✅", "⬆️"];

  // 2. opblock을 순회하며 일치하는 path, method를 찾아 처리
  document.querySelectorAll(".opblock").forEach(opblock => {
    const elSummary = opblock.querySelector(".opblock-summary");
    const elPost = opblock.querySelector(".opblock-control-arrow");
    const elPath = elSummary?.querySelector(".opblock-summary-path");
    const elMethod = elSummary?.querySelector(".opblock-summary-method");

    if (!elPath || !elMethod) return;

    const path = elPath.textContent;
    const method = elMethod.textContent.toLowerCase();
    const key = `${method.toUpperCase()} ${path}`;
    const operation = paths?.[path]?.[method];
    if (!operation) return;

    const text = `${operation.summary || ""} ${operation.description || ""}`;
    const matchedEmoji = Object.keys(emojiToTextMap).find(emoji => text.includes(emoji));
    const matchedStatus = matchedEmoji ? emojiToTextMap[matchedEmoji] : undefined;

    const usedPath = path.split("/");
    const setData = {
      rootTagName: operation.tags?.[0],
      subTagName: operation.operationId + usedPath[2],
      method,
      rootPath: usedPath[2],
      subPath: usedPath[3],
    };

    // ✅ 북마크 아이콘 생성 및 상태 반영
    const bookMark = document.createElement("span");
    bookMark.classList.add("material-symbols-outlined", "bookmark-toggle");
    bookMark.textContent = "bookmark_add";
    bookMark.style.cursor = "pointer";
    bookMark.style.marginRight = "8px";
    bookMark.title = "북마크 추가";


    const saved = localStorage.getItem("usedPath");
    const convertSpec = saved ? JSON.parse(saved) : [];

    const isInitiallyBookmarked = convertSpec.some(item =>
      item.subTagName === setData.subTagName
    );
    if (isInitiallyBookmarked) {
      bookMark.textContent = "bookmark";
      bookMark.title = "북마크 제거";
      bookMark.style.color = "gold";
    }

    bookMark.addEventListener("click", () => {
      const saved = localStorage.getItem("usedPath");
      const currentSpec = saved ? JSON.parse(saved) : [];
      toggleBookmark(setData, bookMark, currentSpec);
    });

    // ✅ 북마크 삽입
    if (elSummary) {
      // 우측 정렬을 위한 스타일 조정
      elSummary.style.display = "flex";
      elSummary.style.justifyContent = "space-between";
      elSummary.style.alignItems = "center";

      // 북마크 wrapper 생성 (optional)
      const bookmarkWrapper = document.createElement("div");
      bookmarkWrapper.style.display = "flex";
      bookmarkWrapper.style.alignItems = "center";

      bookmarkWrapper.appendChild(bookMark);
      elSummary.appendChild(bookmarkWrapper);  // ✅ opblock-summary 오른쪽에 추가
    }

    // ✅ 상태 뱃지 삽입
    const descWrapper = elSummary.querySelector(".opblock-summary-description");
    if (matchedStatus && descWrapper &&
        (!dismissibleStatuses.includes(matchedEmoji) || !isApiSeenRecently(key))) {

      opblock.classList.add(`status-${matchedStatus}`);
      const badgeExists = descWrapper.querySelector(`.badge-${matchedStatus}`);
      if (!badgeExists) {
        const badge = document.createElement("span");
        badge.textContent = matchedStatus;
        badge.className = `badge-${matchedStatus}`;
        badge.dataset.status = matchedStatus;
        badge.style.marginRight = "8px";

        if (dismissibleStatuses.includes(matchedEmoji)) {
          badge.addEventListener("click", () => {
            markApiAsSeen(key, "status");
            badge.remove();
//            opblock.classList.remove(`status-${matchedStatus}`);
//            opblock.style.backgroundColor = '';
//            opblock.style.borderLeft = '';
//            opblock.style.boxShadow = '';
            console.log(`✅ [STATUS] badge 삭제 및 스타일 초기화 완료: ${key}`);
          }, { once: true });
        }

        descWrapper.appendChild(badge);
        console.log(`✅ [STATUS] badge 추가 완료: ${key}`);
      }
    }
  });
}

function toggleBookmark(setData, bookMark, convertSpec) {

  
      // 2. 동일한 항목이 이미 존재하는지 확인
      const index = convertSpec.findIndex(item =>
        item.rootTagName === setData.rootTagName &&
        item.subTagName === setData.subTagName &&
        item.method === setData.method &&
        item.rootPath === setData.rootPath &&
        item.subPath === setData.subPath
      );
  

  // 3. merge 처리: 추가 or 제거
  if (index === -1) {
    convertSpec.push(setData);
    localStorage.setItem("usedPath", JSON.stringify(convertSpec));
    bookMark.textContent = "bookmark";
    bookMark.title = "북마크 제거";
    bookMark.style.color = "gold";
    console.log("✅ 북마크 추가:", setData.subTagName);
  } else {
    convertSpec.splice(index, 1);
    localStorage.setItem("usedPath", JSON.stringify(convertSpec));
    bookMark.textContent = "bookmark_add";
    bookMark.title = "북마크 추가";
    bookMark.style.color = "gray";
    console.log("❎ 북마크 제거:", setData.subTagName);
  }
}
