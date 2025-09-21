import { GetApiDataUseCase } from '../../domain/usecases/GetApiData.js';
import { ApiMetadata } from '../../domain/entities/ApiMetadata.js';
import { ApiStatus } from '../../domain/entities/ApiStatus.js';

/**
 * API 데이터 서비스
 * 도메인 유스케이스를 조율하여 API 데이터 관리를 담당하는 애플리케이션 계층 서비스입니다.
 */
export class ApiDataService {
  constructor(apiClient, statusRepository, metadataRepository) {
    this.getApiDataUseCase = new GetApiDataUseCase(
      apiClient,
      statusRepository,
      metadataRepository
    );
    this.cachedData = null;
    this.cacheTimestamp = null;
    this.cacheExpiryTime = 5 * 60 * 1000; // 5분
  }

  /**
   * 모든 API 데이터를 초기화합니다.
   * 
   * @param {boolean} forceRefresh 강제 새로고침 여부
   * @returns {Promise<Object>} API 데이터
   */
  async initializeApiData(forceRefresh = false) {
    try {
      if (!forceRefresh && this.isCacheValid()) {
        return this.cachedData;
      }

      const data = await this.getApiDataUseCase.execute();
      
      if (!this.getApiDataUseCase.validateApiData(data)) {
        throw new Error('Invalid API data received');
      }

      this.cachedData = this.transformApiData(data);
      this.cacheTimestamp = Date.now();

      return this.cachedData;
    } catch (error) {
      console.error('Failed to initialize API data:', error);
      throw new Error(`API data initialization failed: ${error.message}`);
    }
  }

  /**
   * API 데이터를 변환하여 도메인 엔터티로 매핑합니다.
   * 
   * @param {Object} rawData 원시 API 데이터
   * @returns {Object} 변환된 API 데이터
   */
  transformApiData(rawData) {
    try {
      return {
        statusMap: this.transformStatusMap(rawData.statusMap),
        metadataMap: this.transformMetadataMap(rawData.createdMap),
        groupedList: rawData.groupedList || [],
        statistics: this.generateStatistics(rawData)
      };
    } catch (error) {
      console.error('Failed to transform API data:', error);
      return {
        statusMap: {},
        metadataMap: {},
        groupedList: [],
        statistics: {}
      };
    }
  }

  /**
   * 상태 맵을 ApiStatus 엔터티로 변환합니다.
   * 
   * @param {Object} rawStatusMap 원시 상태 맵
   * @returns {Object} 변환된 상태 맵
   */
  transformStatusMap(rawStatusMap) {
    const statusMap = {};
    
    try {
      Object.entries(rawStatusMap || {}).forEach(([key, status]) => {
        try {
          statusMap[key] = new ApiStatus(status);
        } catch (error) {
          console.warn(`Invalid status for ${key}: ${status}`);
          statusMap[key] = new ApiStatus(ApiStatus.STATUS_TYPES.NOT_WORKING);
        }
      });
    } catch (error) {
      console.error('Failed to transform status map:', error);
    }

    return statusMap;
  }

  /**
   * 메타데이터 맵을 ApiMetadata 엔터티로 변환합니다.
   * 
   * @param {Object} rawMetadataMap 원시 메타데이터 맵
   * @returns {Object} 변환된 메타데이터 맵
   */
  transformMetadataMap(rawMetadataMap) {
    const metadataMap = {};

    try {
      Object.entries(rawMetadataMap || {}).forEach(([controllerName, data]) => {
        try {
          metadataMap[controllerName] = new ApiMetadata(
            controllerName,
            data.tag,
            data.methods
          );
        } catch (error) {
          console.warn(`Invalid metadata for ${controllerName}:`, error);
        }
      });
    } catch (error) {
      console.error('Failed to transform metadata map:', error);
    }

    return metadataMap;
  }

  /**
   * API 데이터 통계를 생성합니다.
   * 
   * @param {Object} rawData 원시 API 데이터
   * @returns {Object} 통계 데이터
   */
  generateStatistics(rawData) {
    try {
      const statusStats = this.getApiDataUseCase.generateStatusStatistics(rawData.statusMap || {});
      const authorStats = this.getApiDataUseCase.generateAuthorStatistics(rawData.createdMap || {});
      const newApiCount = this.getApiDataUseCase.countNewApis(rawData.createdMap || {});

      return {
        status: statusStats,
        authors: authorStats,
        newApiCount,
        totalApis: Object.keys(rawData.statusMap || {}).length,
        totalControllers: Object.keys(rawData.createdMap || {}).length,
        totalGroups: (rawData.groupedList || []).length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to generate statistics:', error);
      return {};
    }
  }

  /**
   * 특정 그룹의 API 스펙을 조회합니다.
   * 
   * @param {string} groupName 그룹명
   * @returns {Promise<Object>} API 스펙
   */
  async getApiSpecByGroup(groupName) {
    try {
      if (!groupName) {
        throw new Error('Group name is required');
      }

      return await this.getApiDataUseCase.getApiSpecByGroup(groupName);
    } catch (error) {
      console.error(`Failed to get API spec for group ${groupName}:`, error);
      throw error;
    }
  }

  /**
   * 필터링된 API 스펙을 조회합니다.
   * 
   * @returns {Promise<Object>} 필터링된 API 스펙
   */
  async getFilteredApiSpec() {
    try {
      return await this.getApiDataUseCase.getFilteredApiSpec();
    } catch (error) {
      console.error('Failed to get filtered API spec:', error);
      throw error;
    }
  }

  /**
   * API 상태를 조회합니다.
   * 
   * @param {string} apiKey API 키
   * @returns {ApiStatus|null} API 상태
   */
  getApiStatus(apiKey) {
    if (!this.cachedData || !this.cachedData.statusMap) {
      return null;
    }

    return this.cachedData.statusMap[apiKey] || null;
  }

  /**
   * API 메타데이터를 조회합니다.
   * 
   * @param {string} controllerName 컨트롤러명
   * @returns {ApiMetadata|null} API 메타데이터
   */
  getApiMetadata(controllerName) {
    if (!this.cachedData || !this.cachedData.metadataMap) {
      return null;
    }

    return this.cachedData.metadataMap[controllerName] || null;
  }

  /**
   * 그룹 목록을 조회합니다.
   * 
   * @returns {Array} 그룹 목록
   */
  getGroupList() {
    if (!this.cachedData) {
      return [];
    }

    return this.cachedData.groupedList || [];
  }

  /**
   * API 통계를 조회합니다.
   * 
   * @returns {Object} 통계 데이터
   */
  getStatistics() {
    if (!this.cachedData) {
      return {};
    }

    return this.cachedData.statistics || {};
  }

  /**
   * 특정 태그의 API 목록을 조회합니다.
   * 
   * @param {string} tagName 태그명
   * @returns {Array} API 목록
   */
  getApisByTag(tagName) {
    if (!this.cachedData || !this.cachedData.metadataMap) {
      return [];
    }

    const apis = [];
    Object.values(this.cachedData.metadataMap).forEach(metadata => {
      if (metadata.getTag().name === tagName) {
        apis.push(metadata);
      }
    });

    return apis;
  }

  /**
   * 특정 작성자의 API 목록을 조회합니다.
   * 
   * @param {string} author 작성자명
   * @returns {Array} API 목록
   */
  getApisByAuthor(author) {
    if (!this.cachedData || !this.cachedData.metadataMap) {
      return [];
    }

    const apis = [];
    Object.values(this.cachedData.metadataMap).forEach(metadata => {
      Object.entries(metadata.getAllMethods()).forEach(([methodName, methodInfo]) => {
        if (methodInfo.author === author) {
          apis.push({
            controller: metadata.getControllerName(),
            method: methodName,
            methodInfo,
            tag: metadata.getTag()
          });
        }
      });
    });

    return apis;
  }

  /**
   * 최신 API 목록을 조회합니다.
   * 
   * @param {number} days 최근 N일
   * @returns {Array} 최신 API 목록
   */
  getRecentApis(days = 7) {
    if (!this.cachedData || !this.cachedData.metadataMap) {
      return [];
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentApis = [];
    Object.values(this.cachedData.metadataMap).forEach(metadata => {
      Object.entries(metadata.getAllMethods()).forEach(([methodName, methodInfo]) => {
        if (methodInfo.date && new Date(methodInfo.date) >= cutoffDate) {
          recentApis.push({
            controller: metadata.getControllerName(),
            method: methodName,
            methodInfo,
            tag: metadata.getTag()
          });
        }
      });
    });

    return recentApis.sort((a, b) => new Date(b.methodInfo.date) - new Date(a.methodInfo.date));
  }

  /**
   * 캐시 유효성을 확인합니다.
   * 
   * @returns {boolean} 캐시 유효 여부
   */
  isCacheValid() {
    if (!this.cachedData || !this.cacheTimestamp) {
      return false;
    }

    return (Date.now() - this.cacheTimestamp) < this.cacheExpiryTime;
  }

  /**
   * 캐시를 무효화합니다.
   */
  invalidateCache() {
    this.cachedData = null;
    this.cacheTimestamp = null;
  }

  /**
   * 캐시 만료 시간을 설정합니다.
   * 
   * @param {number} expiryTime 만료 시간 (밀리초)
   */
  setCacheExpiryTime(expiryTime) {
    this.cacheExpiryTime = expiryTime;
  }

  /**
   * 서비스 상태를 확인합니다.
   * 
   * @returns {Object} 서비스 상태
   */
  getServiceStatus() {
    return {
      isCacheValid: this.isCacheValid(),
      cacheTimestamp: this.cacheTimestamp,
      dataAvailable: !!this.cachedData,
      statistics: this.getStatistics()
    };
  }

  /**
   * 데이터를 새로고침합니다.
   * 
   * @returns {Promise<Object>} 새로고침된 데이터
   */
  async refresh() {
    return this.initializeApiData(true);
  }
}