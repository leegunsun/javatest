/**
 * 로컬 스토리지 어댑터
 * 브라우저 로컬 스토리지와의 상호작용을 추상화하는 인프라스트럭처 계층 컴포넌트입니다.
 */
export class LocalStorageAdapter {
  constructor(keyPrefix = 'swagger_ui_') {
    this.keyPrefix = keyPrefix;
    this.isAvailable = this.checkAvailability();
  }

  /**
   * 로컬 스토리지 사용 가능 여부를 확인합니다.
   * 
   * @returns {boolean} 사용 가능 여부
   */
  checkAvailability() {
    try {
      const testKey = 'test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('LocalStorage is not available:', error);
      return false;
    }
  }

  /**
   * 키에 접두어를 추가합니다.
   * 
   * @param {string} key 원본 키
   * @returns {string} 접두어가 추가된 키
   */
  getPrefixedKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * 값을 저장합니다.
   * 
   * @param {string} key 키
   * @param {any} value 값
   * @returns {boolean} 저장 성공 여부
   */
  setItem(key, value) {
    if (!this.isAvailable) {
      console.warn('LocalStorage is not available');
      return false;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedValue = this.serialize(value);
      localStorage.setItem(prefixedKey, serializedValue);
      return true;
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      return false;
    }
  }

  /**
   * 값을 조회합니다.
   * 
   * @param {string} key 키
   * @param {any} defaultValue 기본값
   * @returns {any} 저장된 값 또는 기본값
   */
  getItem(key, defaultValue = null) {
    if (!this.isAvailable) {
      return defaultValue;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedValue = localStorage.getItem(prefixedKey);
      
      if (serializedValue === null) {
        return defaultValue;
      }

      return this.deserialize(serializedValue);
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * 값을 제거합니다.
   * 
   * @param {string} key 키
   * @returns {boolean} 제거 성공 여부
   */
  removeItem(key) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      return false;
    }
  }

  /**
   * 키 존재 여부를 확인합니다.
   * 
   * @param {string} key 키
   * @returns {boolean} 존재 여부
   */
  hasItem(key) {
    if (!this.isAvailable) {
      return false;
    }

    const prefixedKey = this.getPrefixedKey(key);
    return localStorage.getItem(prefixedKey) !== null;
  }

  /**
   * 모든 키를 조회합니다.
   * 
   * @returns {Array<string>} 키 목록 (접두어 제거됨)
   */
  getAllKeys() {
    if (!this.isAvailable) {
      return [];
    }

    const keys = [];
    const prefixLength = this.keyPrefix.length;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.keyPrefix)) {
        keys.push(key.substring(prefixLength));
      }
    }

    return keys;
  }

  /**
   * 모든 데이터를 조회합니다.
   * 
   * @returns {Object} 모든 키-값 쌍
   */
  getAllItems() {
    const items = {};
    const keys = this.getAllKeys();

    keys.forEach(key => {
      items[key] = this.getItem(key);
    });

    return items;
  }

  /**
   * 접두어가 일치하는 모든 데이터를 제거합니다.
   * 
   * @returns {boolean} 제거 성공 여부
   */
  clear() {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const keys = this.getAllKeys();
      keys.forEach(key => this.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * 스토리지 사용량을 조회합니다.
   * 
   * @returns {Object} 사용량 정보
   */
  getStorageInfo() {
    if (!this.isAvailable) {
      return { available: false };
    }

    let totalSize = 0;
    let itemCount = 0;
    const items = {};

    try {
      const keys = this.getAllKeys();
      keys.forEach(key => {
        const value = this.getItem(key);
        const size = this.getItemSize(key, value);
        items[key] = { size, value: typeof value };
        totalSize += size;
        itemCount++;
      });

      return {
        available: true,
        totalSize,
        itemCount,
        items,
        quota: this.getStorageQuota()
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { available: true, error: error.message };
    }
  }

  /**
   * 항목의 크기를 계산합니다.
   * 
   * @param {string} key 키
   * @param {any} value 값
   * @returns {number} 바이트 크기
   */
  getItemSize(key, value) {
    const keySize = new Blob([this.getPrefixedKey(key)]).size;
    const valueSize = new Blob([this.serialize(value)]).size;
    return keySize + valueSize;
  }

  /**
   * 스토리지 할당량을 추정합니다.
   * 
   * @returns {number} 추정 할당량 (바이트)
   */
  getStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate().then(estimate => estimate.quota);
    }
    
    // 일반적인 브라우저 할당량 (약 5-10MB)
    return Promise.resolve(5 * 1024 * 1024);
  }

  /**
   * 값을 직렬화합니다.
   * 
   * @param {any} value 값
   * @returns {string} 직렬화된 문자열
   */
  serialize(value) {
    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('Failed to serialize value:', error);
      return String(value);
    }
  }

  /**
   * 값을 역직렬화합니다.
   * 
   * @param {string} serializedValue 직렬화된 값
   * @returns {any} 역직렬화된 값
   */
  deserialize(serializedValue) {
    if (typeof serializedValue !== 'string') {
      return serializedValue;
    }

    try {
      return JSON.parse(serializedValue);
    } catch (error) {
      // JSON 파싱 실패 시 원본 문자열 반환
      return serializedValue;
    }
  }

  /**
   * 배치 작업: 여러 항목을 한번에 저장
   * 
   * @param {Object} items 키-값 쌍 객체
   * @returns {boolean} 저장 성공 여부
   */
  setItems(items) {
    if (!items || typeof items !== 'object') {
      return false;
    }

    let success = true;
    Object.entries(items).forEach(([key, value]) => {
      if (!this.setItem(key, value)) {
        success = false;
      }
    });

    return success;
  }

  /**
   * 배치 작업: 여러 항목을 한번에 제거
   * 
   * @param {Array<string>} keys 키 목록
   * @returns {boolean} 제거 성공 여부
   */
  removeItems(keys) {
    if (!Array.isArray(keys)) {
      return false;
    }

    let success = true;
    keys.forEach(key => {
      if (!this.removeItem(key)) {
        success = false;
      }
    });

    return success;
  }

  /**
   * 데이터 백업
   * 
   * @returns {string} 백업 데이터 (JSON 문자열)
   */
  backup() {
    try {
      const allItems = this.getAllItems();
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        prefix: this.keyPrefix,
        data: allItems
      });
    } catch (error) {
      console.error('Failed to backup data:', error);
      return null;
    }
  }

  /**
   * 데이터 복원
   * 
   * @param {string} backupData 백업 데이터
   * @returns {boolean} 복원 성공 여부
   */
  restore(backupData) {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.data || typeof backup.data !== 'object') {
        throw new Error('Invalid backup data format');
      }

      // 기존 데이터 제거 (선택적)
      // this.clear();

      return this.setItems(backup.data);
    } catch (error) {
      console.error('Failed to restore data:', error);
      return false;
    }
  }
}