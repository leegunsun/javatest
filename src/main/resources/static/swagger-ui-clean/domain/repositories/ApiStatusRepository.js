/**
 * API 상태 데이터 접근을 위한 리포지토리 인터페이스
 */
export class ApiStatusRepository {
  /**
   * API 상태 맵을 가져옵니다
   * @returns {Promise<Map<string, string>>}
   */
  async getApiStatusMap() {
    throw new Error('Method must be implemented');
  }

  /**
   * API 생성 날짜 맵을 가져옵니다
   * @returns {Promise<Map<string, Date>>}
   */
  async getApiCreatedDateMap() {
    throw new Error('Method must be implemented');
  }

  /**
   * API 상태를 업데이트합니다
   * @param {string} path 
   * @param {string} status 
   * @returns {Promise<void>}
   */
  async updateApiStatus(path, status) {
    throw new Error('Method must be implemented');
  }

  /**
   * 모든 API 상태 데이터를 가져옵니다
   * @returns {Promise<{statusMap: Object, createdMap: Object, groupedList: Array}>}
   */
  async fetchAllData() {
    throw new Error('Method must be implemented');
  }
}