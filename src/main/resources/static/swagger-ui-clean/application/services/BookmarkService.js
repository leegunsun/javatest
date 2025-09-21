import { ManageBookmarksUseCase } from '../../domain/usecases/ManageBookmarks.js';

/**
 * 북마크 서비스
 * 북마크 관리 기능을 제공하는 애플리케이션 계층 서비스입니다.
 */
export class BookmarkService {
  constructor(bookmarkRepository) {
    this.manageBookmarksUseCase = new ManageBookmarksUseCase(bookmarkRepository);
    this.observers = [];
    this.currentBookmarks = [];
    this.selectedBookmarks = new Set();
  }

  /**
   * 북마크 서비스를 초기화합니다.
   * 
   * @returns {Promise<Array>} 초기화된 북마크 목록
   */
  async initialize() {
    try {
      this.currentBookmarks = this.manageBookmarksUseCase.getAllBookmarks();
      this.notifyObservers('bookmarks-loaded', this.currentBookmarks);
      return this.currentBookmarks;
    } catch (error) {
      console.error('Failed to initialize bookmark service:', error);
      throw new Error(`Bookmark service initialization failed: ${error.message}`);
    }
  }

  /**
   * 북마크를 추가합니다.
   * 
   * @param {Object} bookmarkData 북마크 데이터
   * @returns {Promise<boolean>} 추가 성공 여부
   */
  async addBookmark(bookmarkData) {
    try {
      const success = this.manageBookmarksUseCase.addBookmark(bookmarkData);
      
      if (success) {
        this.currentBookmarks = this.manageBookmarksUseCase.getAllBookmarks();
        this.notifyObservers('bookmark-added', bookmarkData);
        this.notifyObservers('bookmarks-changed', this.currentBookmarks);
      }

      return success;
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      this.notifyObservers('bookmark-error', { action: 'add', error: error.message });
      return false;
    }
  }

  /**
   * 여러 북마크를 한번에 추가합니다.
   * 
   * @param {Array} bookmarkList 북마크 목록
   * @returns {Promise<Object>} 추가 결과
   */
  async addMultipleBookmarks(bookmarkList) {
    try {
      const result = this.manageBookmarksUseCase.addMultipleBookmarks(bookmarkList);
      
      if (result.success > 0) {
        this.currentBookmarks = this.manageBookmarksUseCase.getAllBookmarks();
        this.notifyObservers('bookmarks-batch-added', result);
        this.notifyObservers('bookmarks-changed', this.currentBookmarks);
      }

      return result;
    } catch (error) {
      console.error('Failed to add multiple bookmarks:', error);
      this.notifyObservers('bookmark-error', { action: 'batch-add', error: error.message });
      return { success: 0, failed: bookmarkList.length };
    }
  }

  /**
   * 북마크를 제거합니다.
   * 
   * @param {string} bookmarkId 북마크 ID
   * @returns {Promise<boolean>} 제거 성공 여부
   */
  async removeBookmark(bookmarkId) {
    try {
      const success = this.manageBookmarksUseCase.removeBookmark(bookmarkId);
      
      if (success) {
        this.currentBookmarks = this.manageBookmarksUseCase.getAllBookmarks();
        this.selectedBookmarks.delete(bookmarkId);
        this.notifyObservers('bookmark-removed', bookmarkId);
        this.notifyObservers('bookmarks-changed', this.currentBookmarks);
      }

      return success;
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      this.notifyObservers('bookmark-error', { action: 'remove', error: error.message });
      return false;
    }
  }

  /**
   * 선택된 북마크들을 제거합니다.
   * 
   * @returns {Promise<number>} 제거된 북마크 수
   */
  async removeSelectedBookmarks() {
    try {
      let removedCount = 0;

      for (const bookmarkId of this.selectedBookmarks) {
        if (this.manageBookmarksUseCase.removeBookmark(bookmarkId)) {
          removedCount++;
        }
      }

      if (removedCount > 0) {
        this.currentBookmarks = this.manageBookmarksUseCase.getAllBookmarks();
        this.selectedBookmarks.clear();
        this.notifyObservers('bookmarks-batch-removed', removedCount);
        this.notifyObservers('bookmarks-changed', this.currentBookmarks);
      }

      return removedCount;
    } catch (error) {
      console.error('Failed to remove selected bookmarks:', error);
      this.notifyObservers('bookmark-error', { action: 'batch-remove', error: error.message });
      return 0;
    }
  }

  /**
   * 모든 북마크를 제거합니다.
   * 
   * @returns {Promise<boolean>} 제거 성공 여부
   */
  async clearAllBookmarks() {
    try {
      const success = this.manageBookmarksUseCase.clearAllBookmarks();
      
      if (success) {
        this.currentBookmarks = [];
        this.selectedBookmarks.clear();
        this.notifyObservers('bookmarks-cleared');
        this.notifyObservers('bookmarks-changed', this.currentBookmarks);
      }

      return success;
    } catch (error) {
      console.error('Failed to clear all bookmarks:', error);
      this.notifyObservers('bookmark-error', { action: 'clear', error: error.message });
      return false;
    }
  }

  /**
   * 북마크를 검색합니다.
   * 
   * @param {string} query 검색어
   * @returns {Array} 검색 결과
   */
  searchBookmarks(query) {
    try {
      const results = this.manageBookmarksUseCase.searchBookmarks(query);
      this.notifyObservers('bookmarks-searched', { query, results });
      return results;
    } catch (error) {
      console.error('Failed to search bookmarks:', error);
      return [];
    }
  }

  /**
   * 태그별 북마크를 조회합니다.
   * 
   * @returns {Object} 태그별 북마크 그룹
   */
  getBookmarksByTag() {
    try {
      return this.manageBookmarksUseCase.getBookmarksByTag();
    } catch (error) {
      console.error('Failed to get bookmarks by tag:', error);
      return {};
    }
  }

  /**
   * 특정 태그의 북마크를 조회합니다.
   * 
   * @param {string} tagName 태그명
   * @returns {Array} 해당 태그의 북마크 목록
   */
  getBookmarksByTagName(tagName) {
    try {
      return this.manageBookmarksUseCase.getBookmarksByTagName(tagName);
    } catch (error) {
      console.error(`Failed to get bookmarks for tag ${tagName}:`, error);
      return [];
    }
  }

  /**
   * 북마크를 선택/해제합니다.
   * 
   * @param {string} bookmarkId 북마크 ID
   * @param {boolean} selected 선택 여부
   */
  toggleBookmarkSelection(bookmarkId, selected = null) {
    try {
      if (selected === null) {
        selected = !this.selectedBookmarks.has(bookmarkId);
      }

      if (selected) {
        this.selectedBookmarks.add(bookmarkId);
      } else {
        this.selectedBookmarks.delete(bookmarkId);
      }

      this.notifyObservers('bookmark-selection-changed', {
        bookmarkId,
        selected,
        selectedCount: this.selectedBookmarks.size
      });
    } catch (error) {
      console.error('Failed to toggle bookmark selection:', error);
    }
  }

  /**
   * 모든 북마크를 선택/해제합니다.
   * 
   * @param {boolean} selectAll 전체 선택 여부
   */
  toggleAllBookmarks(selectAll) {
    try {
      if (selectAll) {
        this.currentBookmarks.forEach(bookmark => {
          this.selectedBookmarks.add(bookmark.id);
        });
      } else {
        this.selectedBookmarks.clear();
      }

      this.notifyObservers('all-bookmarks-selection-changed', {
        selectAll,
        selectedCount: this.selectedBookmarks.size
      });
    } catch (error) {
      console.error('Failed to toggle all bookmarks:', error);
    }
  }

  /**
   * 현재 북마크 목록을 반환합니다.
   * 
   * @returns {Array} 북마크 목록
   */
  getCurrentBookmarks() {
    return [...this.currentBookmarks];
  }

  /**
   * 선택된 북마크 목록을 반환합니다.
   * 
   * @returns {Array} 선택된 북마크 목록
   */
  getSelectedBookmarks() {
    return this.currentBookmarks.filter(bookmark => 
      this.selectedBookmarks.has(bookmark.id)
    );
  }

  /**
   * 북마크 통계를 조회합니다.
   * 
   * @returns {Object} 북마크 통계
   */
  getBookmarkStatistics() {
    try {
      const baseStats = this.manageBookmarksUseCase.getBookmarkStatistics();
      
      return {
        ...baseStats,
        selectedCount: this.selectedBookmarks.size,
        hasSelection: this.selectedBookmarks.size > 0
      };
    } catch (error) {
      console.error('Failed to get bookmark statistics:', error);
      return {};
    }
  }

  /**
   * 북마크 데이터를 검증하고 복구합니다.
   * 
   * @returns {Promise<Object>} 검증 및 복구 결과
   */
  async validateAndRepair() {
    try {
      const result = this.manageBookmarksUseCase.validateAndRepairBookmarks();
      
      if (result.repaired) {
        this.currentBookmarks = this.manageBookmarksUseCase.getAllBookmarks();
        this.notifyObservers('bookmarks-repaired', result);
        this.notifyObservers('bookmarks-changed', this.currentBookmarks);
      }

      return result;
    } catch (error) {
      console.error('Failed to validate and repair bookmarks:', error);
      return { valid: 0, invalid: 0, repaired: false };
    }
  }

  /**
   * 북마크 데이터를 내보냅니다.
   * 
   * @returns {string} 내보낸 데이터 (JSON 문자열)
   */
  exportBookmarks() {
    try {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        bookmarks: this.currentBookmarks,
        statistics: this.getBookmarkStatistics()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export bookmarks:', error);
      return null;
    }
  }

  /**
   * 북마크 데이터를 가져옵니다.
   * 
   * @param {string} importData 가져올 데이터 (JSON 문자열)
   * @returns {Promise<boolean>} 가져오기 성공 여부
   */
  async importBookmarks(importData) {
    try {
      const data = JSON.parse(importData);
      
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        throw new Error('Invalid import data format');
      }

      const result = this.manageBookmarksUseCase.addMultipleBookmarks(data.bookmarks);
      
      if (result.success > 0) {
        this.currentBookmarks = this.manageBookmarksUseCase.getAllBookmarks();
        this.notifyObservers('bookmarks-imported', result);
        this.notifyObservers('bookmarks-changed', this.currentBookmarks);
      }

      return result.success > 0;
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
      this.notifyObservers('bookmark-error', { action: 'import', error: error.message });
      return false;
    }
  }

  /**
   * 옵저버를 추가합니다.
   * 
   * @param {Function} observer 옵저버 함수
   */
  addObserver(observer) {
    if (typeof observer === 'function') {
      this.observers.push(observer);
    }
  }

  /**
   * 옵저버를 제거합니다.
   * 
   * @param {Function} observer 제거할 옵저버 함수
   */
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * 옵저버들에게 이벤트를 알립니다.
   * 
   * @param {string} event 이벤트명
   * @param {any} data 이벤트 데이터
   */
  notifyObservers(event, data = null) {
    this.observers.forEach(observer => {
      try {
        observer(event, data);
      } catch (error) {
        console.error('Observer error:', error);
      }
    });
  }

  /**
   * 서비스를 초기화합니다.
   */
  reset() {
    this.currentBookmarks = [];
    this.selectedBookmarks.clear();
    this.observers = [];
  }
}