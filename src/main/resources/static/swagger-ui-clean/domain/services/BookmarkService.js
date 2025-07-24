/**
 * 북마크 관리 도메인 서비스
 */
export class BookmarkService {
  constructor(storageRepository) {
    this.storageRepository = storageRepository;
    this.BOOKMARK_KEY = 'swagger_bookmarks';
  }

  /**
   * 북마크된 API 목록을 가져옵니다
   * @returns {Array<string>}
   */
  getBookmarkedApis() {
    const bookmarksJson = this.storageRepository.getItem(this.BOOKMARK_KEY);
    return bookmarksJson ? JSON.parse(bookmarksJson) : [];
  }

  /**
   * API를 북마크에 추가합니다
   * @param {string} apiPath 
   */
  addBookmark(apiPath) {
    const bookmarks = this.getBookmarkedApis();
    if (!bookmarks.includes(apiPath)) {
      bookmarks.push(apiPath);
      this.storageRepository.setItem(this.BOOKMARK_KEY, JSON.stringify(bookmarks));
    }
  }

  /**
   * API를 북마크에서 제거합니다
   * @param {string} apiPath 
   */
  removeBookmark(apiPath) {
    const bookmarks = this.getBookmarkedApis();
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark !== apiPath);
    this.storageRepository.setItem(this.BOOKMARK_KEY, JSON.stringify(updatedBookmarks));
  }

  /**
   * API가 북마크되어 있는지 확인합니다
   * @param {string} apiPath 
   * @returns {boolean}
   */
  isBookmarked(apiPath) {
    const bookmarks = this.getBookmarkedApis();
    return bookmarks.includes(apiPath);
  }

  /**
   * 북마크를 토글합니다
   * @param {string} apiPath 
   * @returns {boolean} 토글 후 북마크 상태
   */
  toggleBookmark(apiPath) {
    if (this.isBookmarked(apiPath)) {
      this.removeBookmark(apiPath);
      return false;
    } else {
      this.addBookmark(apiPath);
      return true;
    }
  }

  /**
   * 모든 북마크를 초기화합니다
   */
  clearAllBookmarks() {
    this.storageRepository.removeItem(this.BOOKMARK_KEY);
  }
}