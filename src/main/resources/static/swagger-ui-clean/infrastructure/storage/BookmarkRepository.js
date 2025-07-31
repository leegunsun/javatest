import { LocalStorageAdapter } from './LocalStorageAdapter.js';

/**
 * 북마크 저장소
 * 북마크 데이터의 영속성을 담당하는 인프라스트럭처 계층 컴포넌트입니다.
 */
export class BookmarkRepository {
  constructor(storageAdapter = null) {
    this.storage = storageAdapter || new LocalStorageAdapter('bookmark_');
    this.BOOKMARKS_KEY = 'bookmarks';
    this.BOOKMARK_GROUPS_KEY = 'bookmark_groups';
    this.SETTINGS_KEY = 'settings';
  }

  /**
   * 모든 북마크를 조회합니다.
   * 
   * @returns {Array} 북마크 목록
   */
  getAll() {
    try {
      const bookmarks = this.storage.getItem(this.BOOKMARKS_KEY, []);
      return Array.isArray(bookmarks) ? bookmarks : [];
    } catch (error) {
      console.error('Failed to get all bookmarks:', error);
      return [];
    }
  }

  /**
   * 모든 북마크를 저장합니다.
   * 
   * @param {Array} bookmarks 북마크 목록
   * @returns {boolean} 저장 성공 여부
   */
  saveAll(bookmarks) {
    try {
      if (!Array.isArray(bookmarks)) {
        throw new Error('Bookmarks must be an array');
      }

      const success = this.storage.setItem(this.BOOKMARKS_KEY, bookmarks);
      
      if (success) {
        this.updateLastModified();
      }

      return success;
    } catch (error) {
      console.error('Failed to save all bookmarks:', error);
      return false;
    }
  }

  /**
   * 특정 ID의 북마크를 조회합니다.
   * 
   * @param {string} id 북마크 ID
   * @returns {Object|null} 북마크 데이터
   */
  getById(id) {
    try {
      const bookmarks = this.getAll();
      return bookmarks.find(bookmark => bookmark.id === id) || null;
    } catch (error) {
      console.error(`Failed to get bookmark ${id}:`, error);
      return null;
    }
  }

  /**
   * 북마크를 추가합니다.
   * 
   * @param {Object} bookmark 북마크 데이터
   * @returns {boolean} 추가 성공 여부
   */
  add(bookmark) {
    try {
      if (!bookmark || typeof bookmark !== 'object') {
        throw new Error('Invalid bookmark data');
      }

      const bookmarks = this.getAll();
      
      // ID가 없으면 생성
      if (!bookmark.id) {
        bookmark.id = this.generateId();
      }

      // 생성 시간 추가
      if (!bookmark.createdAt) {
        bookmark.createdAt = new Date().toISOString();
      }

      bookmarks.push(bookmark);
      return this.saveAll(bookmarks);
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      return false;
    }
  }

  /**
   * 북마크를 업데이트합니다.
   * 
   * @param {string} id 북마크 ID
   * @param {Object} updateData 업데이트할 데이터
   * @returns {boolean} 업데이트 성공 여부
   */
  update(id, updateData) {
    try {
      const bookmarks = this.getAll();
      const index = bookmarks.findIndex(bookmark => bookmark.id === id);
      
      if (index === -1) {
        return false;
      }

      bookmarks[index] = {
        ...bookmarks[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      return this.saveAll(bookmarks);
    } catch (error) {
      console.error(`Failed to update bookmark ${id}:`, error);
      return false;
    }
  }

  /**
   * 북마크를 제거합니다.
   * 
   * @param {string} id 북마크 ID
   * @returns {boolean} 제거 성공 여부
   */
  remove(id) {
    try {
      const bookmarks = this.getAll();
      const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
      
      if (filteredBookmarks.length === bookmarks.length) {
        return false; // 제거할 북마크가 없음
      }

      return this.saveAll(filteredBookmarks);
    } catch (error) {
      console.error(`Failed to remove bookmark ${id}:`, error);
      return false;
    }
  }

  /**
   * 조건에 맞는 북마크들을 제거합니다.
   * 
   * @param {Function} predicate 조건 함수
   * @returns {number} 제거된 북마크 수
   */
  removeWhere(predicate) {
    try {
      const bookmarks = this.getAll();
      const initialCount = bookmarks.length;
      const filteredBookmarks = bookmarks.filter(bookmark => !predicate(bookmark));
      
      if (this.saveAll(filteredBookmarks)) {
        return initialCount - filteredBookmarks.length;
      }

      return 0;
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
  clear() {
    return this.saveAll([]);
  }

  /**
   * 북마크 개수를 반환합니다.
   * 
   * @returns {number} 북마크 개수
   */
  count() {
    return this.getAll().length;
  }

  /**
   * 북마크 존재 여부를 확인합니다.
   * 
   * @param {string} id 북마크 ID
   * @returns {boolean} 존재 여부
   */
  exists(id) {
    return this.getById(id) !== null;
  }

  /**
   * 조건에 맞는 북마크들을 조회합니다.
   * 
   * @param {Function} predicate 조건 함수
   * @returns {Array} 조건에 맞는 북마크 목록
   */
  findWhere(predicate) {
    try {
      const bookmarks = this.getAll();
      return bookmarks.filter(predicate);
    } catch (error) {
      console.error('Failed to find bookmarks:', error);
      return [];
    }
  }

  /**
   * 조건에 맞는 첫 번째 북마크를 조회합니다.
   * 
   * @param {Function} predicate 조건 함수
   * @returns {Object|null} 첫 번째 매칭 북마크
   */
  findFirst(predicate) {
    try {
      const bookmarks = this.getAll();
      return bookmarks.find(predicate) || null;
    } catch (error) {
      console.error('Failed to find first bookmark:', error);
      return null;
    }
  }

  /**
   * 북마크 그룹을 조회합니다.
   * 
   * @returns {Array} 북마크 그룹 목록
   */
  getGroups() {
    return this.storage.getItem(this.BOOKMARK_GROUPS_KEY, []);
  }

  /**
   * 북마크 그룹을 저장합니다.
   * 
   * @param {Array} groups 그룹 목록
   * @returns {boolean} 저장 성공 여부
   */
  saveGroups(groups) {
    return this.storage.setItem(this.BOOKMARK_GROUPS_KEY, groups);
  }

  /**
   * 북마크 설정을 조회합니다.
   * 
   * @returns {Object} 설정 데이터
   */
  getSettings() {
    return this.storage.getItem(this.SETTINGS_KEY, {});
  }

  /**
   * 북마크 설정을 저장합니다.
   * 
   * @param {Object} settings 설정 데이터
   * @returns {boolean} 저장 성공 여부
   */
  saveSettings(settings) {
    return this.storage.setItem(this.SETTINGS_KEY, settings);
  }

  /**
   * 저장소 통계를 조회합니다.
   * 
   * @returns {Object} 저장소 통계
   */
  getStatistics() {
    try {
      const bookmarks = this.getAll();
      const groups = this.getGroups();
      const storageInfo = this.storage.getStorageInfo();

      return {
        bookmarkCount: bookmarks.length,
        groupCount: groups.length,
        lastModified: this.getLastModified(),
        storageSize: storageInfo.totalSize || 0,
        createdToday: this.countCreatedToday(bookmarks),
        tagDistribution: this.getTagDistribution(bookmarks)
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {};
    }
  }

  /**
   * 데이터를 백업합니다.
   * 
   * @returns {string} 백업 데이터 (JSON 문자열)
   */
  backup() {
    try {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        bookmarks: this.getAll(),
        groups: this.getGroups(),
        settings: this.getSettings()
      });
    } catch (error) {
      console.error('Failed to backup data:', error);
      return null;
    }
  }

  /**
   * 데이터를 복원합니다.
   * 
   * @param {string} backupData 백업 데이터
   * @returns {boolean} 복원 성공 여부
   */
  restore(backupData) {
    try {
      const backup = JSON.parse(backupData);

      if (backup.bookmarks) {
        this.saveAll(backup.bookmarks);
      }

      if (backup.groups) {
        this.saveGroups(backup.groups);
      }

      if (backup.settings) {
        this.saveSettings(backup.settings);
      }

      return true;
    } catch (error) {
      console.error('Failed to restore data:', error);
      return false;
    }
  }

  /**
   * 고유 ID를 생성합니다.
   * 
   * @returns {string} 생성된 ID
   */
  generateId() {
    return 'bookmark_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 마지막 수정 시간을 업데이트합니다.
   */
  updateLastModified() {
    this.storage.setItem('last_modified', new Date().toISOString());
  }

  /**
   * 마지막 수정 시간을 조회합니다.
   * 
   * @returns {string|null} 마지막 수정 시간
   */
  getLastModified() {
    return this.storage.getItem('last_modified');
  }

  /**
   * 오늘 생성된 북마크 수를 계산합니다.
   * 
   * @param {Array} bookmarks 북마크 목록
   * @returns {number} 오늘 생성된 북마크 수
   */
  countCreatedToday(bookmarks) {
    const today = new Date().toDateString();
    return bookmarks.filter(bookmark => {
      if (!bookmark.createdAt) return false;
      return new Date(bookmark.createdAt).toDateString() === today;
    }).length;
  }

  /**
   * 태그 분포를 계산합니다.
   * 
   * @param {Array} bookmarks 북마크 목록
   * @returns {Object} 태그별 북마크 수
   */
  getTagDistribution(bookmarks) {
    const distribution = {};
    
    bookmarks.forEach(bookmark => {
      const tag = bookmark.rootTagName || 'Unknown';
      distribution[tag] = (distribution[tag] || 0) + 1;
    });

    return distribution;
  }
}