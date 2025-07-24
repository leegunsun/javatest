import { ApiStatusRepository } from '../../domain/repositories/ApiStatusRepository.js';

/**
 * API 상태 리포지토리 구현체
 */
export class ApiStatusRepositoryImpl extends ApiStatusRepository {
  constructor() {
    super();
    this.apiStatusMap = new Map();
    this.apiCreatedDateMap = new Map();
  }

  /**
   * API 상태 맵을 가져옵니다
   * @returns {Promise<Map<string, string>>}
   */
  async getApiStatusMap() {
    return this.apiStatusMap;
  }

  /**
   * API 생성 날짜 맵을 가져옵니다
   * @returns {Promise<Map<string, Date>>}
   */
  async getApiCreatedDateMap() {
    return this.apiCreatedDateMap;
  }

  /**
   * API 상태를 업데이트합니다
   * @param {string} path 
   * @param {string} status 
   */
  async updateApiStatus(path, status) {
    this.apiStatusMap.set(path, status);
  }

  /**
   * API 상태 맵을 설정합니다
   * @param {Object} statusMap 
   */
  setApiStatusMap(statusMap) {
    this.apiStatusMap = new Map(Object.entries(statusMap || {}));
  }

  /**
   * API 생성 날짜 맵을 설정합니다
   * @param {Object} createdMap 
   */
  setApiCreatedDateMap(createdMap) {
    this.apiCreatedDateMap = new Map(Object.entries(createdMap || {}));
  }

  /**
   * 모든 API 상태 데이터를 가져옵니다
   * @returns {Promise<{statusMap: Object, createdMap: Object, groupedList: Array}>}
   */
  async fetchAllData() {
    try {
      // API 상태 데이터 fetch
      const statusResponse = await fetch('/swagger-status/api-status.json');
      const statusData = await statusResponse.json();

      // API 메타 데이터 fetch  
      const metaResponse = await fetch('/swagger-status/api-meta.json');
      const metaData = await metaResponse.json();

      // 그룹화된 API 리스트 fetch
      const groupResponse = await fetch('/v3/api-docs');
      const groupData = await groupResponse.json();

      // 내부 상태 업데이트
      this.setApiStatusMap(statusData);
      this.setApiCreatedDateMap(metaData);

      return {
        statusMap: statusData || {},
        createdMap: metaData || {},
        groupedList: this.extractGroupedList(groupData)
      };
    } catch (error) {
      console.error('API 데이터 fetch 실패:', error);
      return {
        statusMap: {},
        createdMap: {},
        groupedList: []
      };
    }
  }

  /**
   * 그룹화된 API 리스트를 추출합니다
   * @param {Object} groupData 
   * @returns {Array}
   */
  extractGroupedList(groupData) {
    if (!groupData || !Array.isArray(groupData.groups)) {
      return [];
    }

    return groupData.groups.map(group => ({
      group: group.name,
      description: group.description || '',
      apis: group.apis || []
    }));
  }

  /**
   * 로컬 스토리지에서 사용자 경로를 가져옵니다
   * @returns {string|null}
   */
  getLocalStorageUsedPath() {
    try {
      return localStorage.getItem('swagger_used_paths');
    } catch (error) {
      console.error('로컬 스토리지 읽기 실패:', error);
      return null;
    }
  }

  /**
   * 로컬 스토리지에 사용자 경로를 저장합니다
   * @param {string} paths 
   */
  setLocalStorageUsedPath(paths) {
    try {
      localStorage.setItem('swagger_used_paths', paths);
    } catch (error) {
      console.error('로컬 스토리지 저장 실패:', error);
    }
  }
}