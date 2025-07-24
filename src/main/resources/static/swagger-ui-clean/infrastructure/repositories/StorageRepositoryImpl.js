import { StorageRepository } from '../../domain/repositories/StorageRepository.js';

/**
 * 브라우저 스토리지 리포지토리 구현체
 */
export class StorageRepositoryImpl extends StorageRepository {
  /**
   * 로컬 스토리지에서 값을 가져옵니다
   * @param {string} key 
   * @returns {string|null}
   */
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`로컬 스토리지 읽기 실패 (${key}):`, error);
      return null;
    }
  }

  /**
   * 로컬 스토리지에 값을 저장합니다
   * @param {string} key 
   * @param {string} value 
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`로컬 스토리지 저장 실패 (${key}):`, error);
    }
  }

  /**
   * 로컬 스토리지에서 값을 삭제합니다
   * @param {string} key 
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`로컬 스토리지 삭제 실패 (${key}):`, error);
    }
  }

  /**
   * 로컬 스토리지를 초기화합니다
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('로컬 스토리지 초기화 실패:', error);
    }
  }

  /**
   * 쿠키를 초기화합니다
   */
  clearCookies() {
    try {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    } catch (error) {
      console.error('쿠키 초기화 실패:', error);
    }
  }

  /**
   * JSON 형태로 데이터를 저장합니다
   * @param {string} key 
   * @param {Object} data 
   */
  setJsonItem(key, data) {
    try {
      const jsonString = JSON.stringify(data);
      this.setItem(key, jsonString);
    } catch (error) {
      console.error(`JSON 데이터 저장 실패 (${key}):`, error);
    }
  }

  /**
   * JSON 형태로 데이터를 가져옵니다
   * @param {string} key 
   * @param {*} defaultValue 
   * @returns {*}
   */
  getJsonItem(key, defaultValue = null) {
    try {
      const jsonString = this.getItem(key);
      if (jsonString === null) {
        return defaultValue;
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.error(`JSON 데이터 읽기 실패 (${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * 스토리지 용량을 확인합니다
   * @returns {Object}
   */
  getStorageInfo() {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }

      return {
        used: totalSize,
        keys: Object.keys(localStorage).length,
        available: this.getAvailableStorage()
      };
    } catch (error) {
      console.error('스토리지 정보 확인 실패:', error);
      return {
        used: 0,
        keys: 0,
        available: 0
      };
    }
  }

  /**
   * 사용 가능한 스토리지 용량을 확인합니다
   * @returns {number}
   */
  getAvailableStorage() {
    try {
      const testKey = '__storage_test__';
      const testData = 'x';
      let size = 0;

      // 기존 데이터가 있다면 임시 저장
      const originalValue = localStorage.getItem(testKey);

      // 테스트 수행
      try {
        while (true) {
          localStorage.setItem(testKey, testData.repeat(size));
          size++;
        }
      } catch (e) {
        // 용량 초과시 에러 발생
      }

      // 원본 데이터 복원 또는 테스트 키 삭제
      if (originalValue !== null) {
        localStorage.setItem(testKey, originalValue);
      } else {
        localStorage.removeItem(testKey);
      }

      return size - 1;
    } catch (error) {
      console.error('사용 가능한 스토리지 용량 확인 실패:', error);
      return 0;
    }
  }

  /**
   * 특정 패턴의 키들을 삭제합니다
   * @param {RegExp|string} pattern 
   */
  removeItemsByPattern(pattern) {
    try {
      const keys = Object.keys(localStorage);
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

      keys.forEach(key => {
        if (regex.test(key)) {
          this.removeItem(key);
        }
      });
    } catch (error) {
      console.error('패턴 기반 스토리지 삭제 실패:', error);
    }
  }
}