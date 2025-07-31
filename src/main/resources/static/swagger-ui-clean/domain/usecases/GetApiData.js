/**
 * API 데이터 조회 유스케이스
 * 도메인 로직을 캡슐화하여 API 데이터를 조회하는 비즈니스 규칙을 정의합니다.
 */
export class GetApiDataUseCase {
  constructor(apiClient, statusRepository, metadataRepository) {
    this.apiClient = apiClient;
    this.statusRepository = statusRepository;
    this.metadataRepository = metadataRepository;
  }

  /**
   * 모든 API 데이터를 조회합니다.
   * 
   * @returns {Promise<{statusMap: Object, createdMap: Object, groupedList: Array}>}
   */
  async execute() {
    try {
      const [statusMap, createdMap, groupedList] = await Promise.all([
        this.getApiStatusData(),
        this.getApiMetadata(),
        this.getGroupedApiList()
      ]);

      return {
        statusMap,
        createdMap,
        groupedList
      };
    } catch (error) {
      throw new Error(`Failed to fetch API data: ${error.message}`);
    }
  }

  /**
   * API 상태 데이터 조회
   * 
   * @returns {Promise<Object>}
   */
  async getApiStatusData() {
    try {
      return await this.statusRepository.getAll();
    } catch (error) {
      console.warn('Failed to fetch API status data, using empty data:', error);
      return {};
    }
  }

  /**
   * API 메타데이터 조회
   * 
   * @returns {Promise<Object>}
   */
  async getApiMetadata() {
    try {
      return await this.metadataRepository.getAll();
    } catch (error) {
      console.warn('Failed to fetch API metadata, using empty data:', error);
      return {};
    }
  }

  /**
   * 그룹화된 API 목록 조회
   * 
   * @returns {Promise<Array>}
   */
  async getGroupedApiList() {
    try {
      return await this.apiClient.getGroupedList();
    } catch (error) {
      console.warn('Failed to fetch grouped API list, using empty array:', error);
      return [];
    }
  }

  /**
   * 특정 그룹의 API 스펙 조회
   * 
   * @param {string} groupName 
   * @returns {Promise<Object>}
   */
  async getApiSpecByGroup(groupName) {
    if (!groupName) {
      throw new Error('Group name is required');
    }

    try {
      return await this.apiClient.getApiSpec(groupName);
    } catch (error) {
      throw new Error(`Failed to fetch API spec for group ${groupName}: ${error.message}`);
    }
  }

  /**
   * 필터링된 API 스펙 조회
   * 
   * @returns {Promise<Object>}
   */
  async getFilteredApiSpec() {
    try {
      return await this.apiClient.getFilteredApiSpec();
    } catch (error) {
      throw new Error(`Failed to fetch filtered API spec: ${error.message}`);
    }
  }

  /**
   * API 데이터 유효성 검증
   * 
   * @param {Object} data 
   * @returns {boolean}
   */
  validateApiData(data) {
    return (
      data &&
      typeof data.statusMap === 'object' &&
      typeof data.createdMap === 'object' &&
      Array.isArray(data.groupedList)
    );
  }

  /**
   * API 그룹 존재 여부 확인
   * 
   * @param {string} groupName 
   * @param {Array} groupedList 
   * @returns {boolean}
   */
  isGroupExists(groupName, groupedList) {
    if (!groupName || !Array.isArray(groupedList)) {
      return false;
    }

    return groupedList.some(group => group.group === groupName);
  }

  /**
   * 최신 API 개수 계산
   * 
   * @param {Object} createdMap 
   * @param {string} sinceDate 
   * @returns {number}
   */
  countNewApis(createdMap, sinceDate = '2025-01-01') {
    let count = 0;
    const targetDate = new Date(sinceDate);

    Object.values(createdMap).forEach(controller => {
      if (controller.methods) {
        Object.values(controller.methods).forEach(method => {
          if (method.date && new Date(method.date) >= targetDate) {
            count++;
          }
        });
      }
    });

    return count;
  }

  /**
   * API 상태별 통계 생성
   * 
   * @param {Object} statusMap 
   * @returns {Object}
   */
  generateStatusStatistics(statusMap) {
    const stats = {};
    
    Object.values(statusMap).forEach(status => {
      stats[status] = (stats[status] || 0) + 1;
    });

    return stats;
  }

  /**
   * 작성자별 API 통계 생성
   * 
   * @param {Object} createdMap 
   * @returns {Object}
   */
  generateAuthorStatistics(createdMap) {
    const stats = {};

    Object.values(createdMap).forEach(controller => {
      if (controller.methods) {
        Object.values(controller.methods).forEach(method => {
          if (method.author) {
            stats[method.author] = (stats[method.author] || 0) + 1;
          }
        });
      }
    });

    return stats;
  }
}