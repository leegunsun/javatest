import { getLocalStorageUsedPath , setLocalStorageUsedPath } from "../../../../swaggerInitData.js";

export function insertBookmarkToggle(setData, elSummary) {
  const bookMark = document.createElement("span");
  bookMark.classList.add("material-symbols-outlined", "bookmark-toggle");
  bookMark.textContent = "bookmark_add";
  bookMark.style.cursor = "pointer";
  bookMark.style.marginRight = "8px";
  bookMark.title = "북마크 추가";

  const saved = getLocalStorageUsedPath();
  const convertSpec = saved ? JSON.parse(saved) : [];

  const isInitiallyBookmarked = convertSpec.some(
    (item) => item.subTagName === setData.subTagName
  );
  if (isInitiallyBookmarked) {
    bookMark.textContent = "bookmark";
    bookMark.title = "북마크 제거";
    bookMark.style.color = "gold";
  }

  bookMark.addEventListener("click", () => {
    toggleBookmark(setData, bookMark);
  });

  if (elSummary) {
    elSummary.style.display = "flex";
    elSummary.style.justifyContent = "space-between";
    elSummary.style.alignItems = "center";

    const bookmarkWrapper = document.createElement("div");
    bookmarkWrapper.style.display = "flex";
    bookmarkWrapper.style.alignItems = "center";
    bookmarkWrapper.appendChild(bookMark);
    elSummary.appendChild(bookmarkWrapper);
  }
}

function toggleBookmark(setData, bookMark) {
  const saved = getLocalStorageUsedPath();
  const convertSpec = saved ? JSON.parse(saved) : [];

  const index = convertSpec.findIndex(
    (item) =>
      item.rootTagName === setData.rootTagName &&
      item.subTagName === setData.subTagName &&
      item.method === setData.method &&
      item.rootPath === setData.rootPath &&
      item.subPath === setData.subPath
  );

  if (index === -1) {
    convertSpec.push(setData);
    setLocalStorageUsedPath(JSON.stringify(convertSpec))
    bookMark.textContent = "bookmark";
    bookMark.title = "북마크 제거";
    bookMark.style.color = "gold";
    console.log("✅ 북마크 추가:", setData.subTagName);
  } else {
    convertSpec.splice(index, 1);
    setLocalStorageUsedPath(JSON.stringify(convertSpec))
    bookMark.textContent = "bookmark_add";
    bookMark.title = "북마크 추가";
    bookMark.style.color = "gray";
    console.log("❎ 북마크 제거:", setData.subTagName);
  }
}