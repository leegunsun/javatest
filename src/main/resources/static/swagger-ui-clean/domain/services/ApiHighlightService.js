/**
 * API 하이라이트 관련 도메인 서비스
 */
export class ApiHighlightService {
  constructor(apiStatusRepository) {
    this.apiStatusRepository = apiStatusRepository;
  }

  /**
   * API 엔드포인트가 새로운 API인지 확인합니다
   * @param {ApiEndpoint} apiEndpoint 
   * @param {number} daysThreshold 
   * @returns {boolean}
   */
  isNewApi(apiEndpoint, daysThreshold = 30) {
    if (!apiEndpoint.createdDate) return false;
    
    const createdDate = new Date(apiEndpoint.createdDate);
    const now = new Date();
    const diffInDays = (now - createdDate) / (1000 * 60 * 60 * 24);
    
    return diffInDays <= daysThreshold;
  }

  /**
   * API 상태에 따른 스타일 클래스를 반환합니다
   * @param {ApiStatus} apiStatus 
   * @returns {Object}
   */
  getApiStyleClasses(apiStatus) {
    return {
      opblock: apiStatus.getStatusClass(),
      badge: apiStatus.getBadgeClass()
    };
  }

  /**
   * 새로운 API 개수를 계산합니다
   * @param {Array<ApiEndpoint>} apiEndpoints 
   * @param {number} daysThreshold 
   * @returns {number}
   */
  countNewApis(apiEndpoints, daysThreshold = 30) {
    return apiEndpoints.filter(api => this.isNewApi(api, daysThreshold)).length;
  }
}