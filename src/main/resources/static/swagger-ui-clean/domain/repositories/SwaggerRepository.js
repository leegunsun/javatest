/**
 * Swagger API 데이터 접근을 위한 리포지토리 인터페이스
 */
export class SwaggerRepository {
  /**
   * 그룹별 Swagger 스펙을 가져옵니다
   * @param {string} groupName 
   * @returns {Promise<Object>}
   */
  async getSwaggerSpec(groupName) {
    throw new Error('Method must be implemented');
  }

  /**
   * 필터링된 커스텀 Swagger 스펙을 가져옵니다
   * @returns {Promise<Object>}
   */
  async getFilteredSwaggerSpec() {
    throw new Error('Method must be implemented');
  }

  /**
   * API 그룹 목록을 가져옵니다
   * @returns {Promise<Array>}
   */
  async getGroupedApiList() {
    throw new Error('Method must be implemented');
  }
}