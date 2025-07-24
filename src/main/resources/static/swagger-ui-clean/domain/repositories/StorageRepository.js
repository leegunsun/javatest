/**
 * 브라우저 스토리지 접근을 위한 리포지토리 인터페이스
 */
export class StorageRepository {
  /**
   * 로컬 스토리지에서 값을 가져옵니다
   * @param {string} key 
   * @returns {string|null}
   */
  getItem(key) {
    throw new Error('Method must be implemented');
  }

  /**
   * 로컬 스토리지에 값을 저장합니다
   * @param {string} key 
   * @param {string} value 
   */
  setItem(key, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * 로컬 스토리지에서 값을 삭제합니다
   * @param {string} key 
   */
  removeItem(key) {
    throw new Error('Method must be implemented');
  }

  /**
   * 로컬 스토리지를 초기화합니다
   */
  clear() {
    throw new Error('Method must be implemented');
  }

  /**
   * 쿠키를 초기화합니다
   */
  clearCookies() {
    throw new Error('Method must be implemented');
  }
}