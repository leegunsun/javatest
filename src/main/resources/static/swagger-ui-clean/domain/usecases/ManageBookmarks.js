/**
 * 북마크 관리 유스케이스
 * 사용자의 API 북마크를 관리하는 비즈니스 로직을 담당합니다.
 */
export class ManageBookmarksUseCase {
  constructor(bookmarkRepository) {
    this.bookmarkRepository = bookmarkRepository;
  }

  /**
   * 모든 북마크를 조회합니다.
   * 
   * @returns {Array} 북마크 목록
   */
  getAllBookmarks() {
    try {
      return this.bookmarkRepository.getAll();
    } catch (error) {
      console.warn('Failed to get bookmarks:', error);
      return [];
    }
  }

  /**
   * 북마크를 추가합니다.
   * 
   * @param {Object} bookmark 북마크 데이터
   * @param {string} bookmark.rootTagName 루트 태그명
   * @param {string} bookmark.subTagName 서브 태그명 
   * @param {string} bookmark.method HTTP 메서드
   * @param {string} bookmark.rootPath 루트 경로
   * @param {string} bookmark.subPath 서브 경로
   * @returns {boolean} 추가 성공 여부
   */
  addBookmark(bookmark) {
    try {
      // 북마크 유효성 검증
      if (!this.validateBookmarkData(bookmark)) {
        throw new Error('Invalid bookmark data');
      }

      const bookmarks = this.getAllBookmarks();
      
      // 중복 확인
      if (this.isDuplicateBookmark(bookmark, bookmarks)) {
        console.warn('Bookmark already exists');
        return false;
      }

      // 북마크 추가
      bookmarks.push({
        id: this.generateBookmarkId(),
        ...bookmark,
        createdAt: new Date().toISOString()
      });

      this.bookmarkRepository.saveAll(bookmarks);
      return true;
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      return false;
    }
  }

  /**
   * 여러 북마크를 추가합니다.
   * 
   * @param {Array} bookmarkList 북마크 목록
   * @returns {Object} 추가 결과 {success: number, failed: number}
   */
  addMultipleBookmarks(bookmarkList) {
    if (!Array.isArray(bookmarkList)) {
      throw new Error('Bookmark list must be an array');
    }

    let successCount = 0;
    let failedCount = 0;

    bookmarkList.forEach(bookmark => {
      if (this.addBookmark(bookmark)) {
        successCount++;
      } else {
        failedCount++;
      }
    });

    return { success: successCount, failed: failedCount };
  }

  /**
   * 북마크를 제거합니다.
   * 
   * @param {string} bookmarkId 북마크 ID
   * @returns {boolean} 제거 성공 여부
   */
  removeBookmark(bookmarkId) {
    try {
      const bookmarks = this.getAllBookmarks();
      const initialLength = bookmarks.length;
      
      const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
      
      if (filteredBookmarks.length === initialLength) {
        console.warn('Bookmark not found');
        return false;
      }

      this.bookmarkRepository.saveAll(filteredBookmarks);
      return true;
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      return false;
    }
  }

  /**
   * 북마크를 조건으로 제거합니다.
   * 
   * @param {Object} condition 제거 조건
   * @returns {number} 제거된 북마크 수
   */
  removeBookmarksByCondition(condition) {
    try {
      const bookmarks = this.getAllBookmarks();
      const initialLength = bookmarks.length;
      
      const filteredBookmarks = bookmarks.filter(bookmark => {
        return !this.matchesCondition(bookmark, condition);
      });

      this.bookmarkRepository.saveAll(filteredBookmarks);
      return initialLength - filteredBookmarks.length;
    } catch (error) {
      console.error('Failed to remove bookmarks by condition:', error);
      return 0;
    }
  }

  /**
   * 모든 북마크를 제거합니다.
   * 
   * @returns {boolean} 제거 성공 여부
   */
  clearAllBookmarks() {
    try {
      this.bookmarkRepository.saveAll([]);
      return true;
    } catch (error) {
      console.error('Failed to clear all bookmarks:', error);
      return false;
    }
  }

  /**
   * 태그별로 북마크를 그룹화합니다.
   * 
   * @returns {Object} 태그별 북마크 그룹
   */
  getBookmarksByTag() {
    const bookmarks = this.getAllBookmarks();
    const groupedBookmarks = {};

    bookmarks.forEach(bookmark => {
      const tagName = bookmark.rootTagName;
      if (!groupedBookmarks[tagName]) {
        groupedBookmarks[tagName] = [];
      }
      groupedBookmarks[tagName].push(bookmark);
    });

    return groupedBookmarks;
  }

  /**
   * 특정 태그의 북마크를 조회합니다.
   * 
   * @param {string} tagName 태그명
   * @returns {Array} 해당 태그의 북마크 목록
   */
  getBookmarksByTagName(tagName) {
    const bookmarks = this.getAllBookmarks();
    return bookmarks.filter(bookmark => bookmark.rootTagName === tagName);
  }

  /**
   * 북마크 검색
   * 
   * @param {string} query 검색어
   * @returns {Array} 검색 결과
   */
  searchBookmarks(query) {
    if (!query || query.trim() === '') {
      return this.getAllBookmarks();
    }

    const bookmarks = this.getAllBookmarks();
    const searchTerm = query.toLowerCase();

    return bookmarks.filter(bookmark => {
      return (
        bookmark.rootTagName?.toLowerCase().includes(searchTerm) ||
        bookmark.subTagName?.toLowerCase().includes(searchTerm) ||
        bookmark.rootPath?.toLowerCase().includes(searchTerm) ||
        bookmark.subPath?.toLowerCase().includes(searchTerm) ||
        bookmark.method?.toLowerCase().includes(searchTerm)
      );
    });
  }

  /**
   * 북마크 데이터 유효성 검증
   * 
   * @param {Object} bookmark 
   * @returns {boolean}
   */
  validateBookmarkData(bookmark) {
    return bookmark &&
           typeof bookmark.rootTagName === 'string' &&
           typeof bookmark.subTagName === 'string' &&
           typeof bookmark.method === 'string' &&
           typeof bookmark.rootPath === 'string' &&
           typeof bookmark.subPath === 'string';
  }

  /**
   * 중복 북마크 확인
   * 
   * @param {Object} newBookmark 
   * @param {Array} existingBookmarks 
   * @returns {boolean}
   */
  isDuplicateBookmark(newBookmark, existingBookmarks) {
    return existingBookmarks.some(bookmark => {
      return bookmark.rootTagName === newBookmark.rootTagName &&
             bookmark.subTagName === newBookmark.subTagName &&
             bookmark.method === newBookmark.method &&
             bookmark.rootPath === newBookmark.rootPath &&
             bookmark.subPath === newBookmark.subPath;
    });
  }

  /**
   * 조건 매칭 확인
   * 
   * @param {Object} bookmark 
   * @param {Object} condition 
   * @returns {boolean}
   */
  matchesCondition(bookmark, condition) {
    return Object.keys(condition).every(key => {
      return bookmark[key] === condition[key];
    });
  }

  /**
   * 북마크 ID 생성
   * 
   * @returns {string}
   */
  generateBookmarkId() {
    return 'bookmark_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 북마크 통계 생성
   * 
   * @returns {Object}
   */
  getBookmarkStatistics() {
    const bookmarks = this.getAllBookmarks();
    const tagStats = {};
    const methodStats = {};

    bookmarks.forEach(bookmark => {
      // 태그별 통계
      const tagName = bookmark.rootTagName;
      tagStats[tagName] = (tagStats[tagName] || 0) + 1;

      // 메서드별 통계
      const method = bookmark.method.toUpperCase();
      methodStats[method] = (methodStats[method] || 0) + 1;
    });

    return {
      total: bookmarks.length,
      byTag: tagStats,
      byMethod: methodStats,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 북마크 데이터 유효성 검사 및 복구
   * 
   * @returns {Object} 복구 결과
   */
  validateAndRepairBookmarks() {
    const bookmarks = this.getAllBookmarks();
    const validBookmarks = [];
    const invalidBookmarks = [];

    bookmarks.forEach(bookmark => {
      if (this.validateBookmarkData(bookmark)) {
        validBookmarks.push(bookmark);
      } else {
        invalidBookmarks.push(bookmark);
      }
    });

    if (invalidBookmarks.length > 0) {
      this.bookmarkRepository.saveAll(validBookmarks);
    }

    return {
      valid: validBookmarks.length,
      invalid: invalidBookmarks.length,
      repaired: invalidBookmarks.length > 0
    };
  }
}