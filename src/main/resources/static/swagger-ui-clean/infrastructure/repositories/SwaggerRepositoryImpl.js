import { SwaggerRepository } from '../../domain/repositories/SwaggerRepository.js';

/**
 * Swagger 리포지토리 구현체
 */
export class SwaggerRepositoryImpl extends SwaggerRepository {
  constructor() {
    super();
    this.cachedSpecs = new Map();
  }

  /**
   * 그룹별 Swagger 스펙을 가져옵니다
   * @param {string} groupName 
   * @returns {Promise<Object>}
   */
  async getSwaggerSpec(groupName) {
    try {
      // 캐시 확인
      if (this.cachedSpecs.has(groupName)) {
        return this.cachedSpecs.get(groupName);
      }

      // API 호출
      const response = await fetch(`/v3/api-docs/${groupName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const spec = await response.json();
      
      // 캐시 저장
      this.cachedSpecs.set(groupName, spec);
      
      return spec;
    } catch (error) {
      console.error(`Swagger 스펙 로드 실패 (${groupName}):`, error);
      throw error;
    }
  }

  /**
   * 필터링된 커스텀 Swagger 스펙을 가져옵니다
   * @returns {Promise<Object>}
   */
  async getFilteredSwaggerSpec() {
    try {
      // 커스텀 스펙이 이미 캐시되어 있는지 확인
      if (this.cachedSpecs.has('custom')) {
        return this.cachedSpecs.get('custom');
      }

      // 전체 스펙을 먼저 가져옴
      const response = await fetch('/v3/api-docs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fullSpec = await response.json();
      
      // 사용자가 선택한 경로들만 필터링
      const filteredSpec = await this.filterSpecByUserSelection(fullSpec);
      
      // 캐시 저장
      this.cachedSpecs.set('custom', filteredSpec);
      
      return filteredSpec;
    } catch (error) {
      console.error('필터링된 Swagger 스펙 로드 실패:', error);
      throw error;
    }
  }

  /**
   * API 그룹 목록을 가져옵니다
   * @returns {Promise<Array>}
   */
  async getGroupedApiList() {
    try {
      const response = await fetch('/v3/api-docs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.groups || [];
    } catch (error) {
      console.error('그룹화된 API 리스트 로드 실패:', error);
      return [];
    }
  }

  /**
   * 사용자 선택에 따라 스펙을 필터링합니다
   * @param {Object} fullSpec 
   * @returns {Promise<Object>}
   */
  async filterSpecByUserSelection(fullSpec) {
    try {
      // 로컬 스토리지에서 사용자 선택 정보 가져오기
      const userSelection = localStorage.getItem('swagger_used_paths');
      
      if (!userSelection) {
        return fullSpec;
      }

      const selectedPaths = JSON.parse(userSelection);
      
      // 선택된 경로들만 포함하는 새로운 스펙 생성
      const filteredSpec = {
        ...fullSpec,
        paths: {}
      };

      // 선택된 경로만 필터링
      Object.keys(fullSpec.paths || {}).forEach(path => {
        if (this.isPathSelected(path, selectedPaths)) {
          filteredSpec.paths[path] = fullSpec.paths[path];
        }
      });

      return filteredSpec;
    } catch (error) {
      console.error('스펙 필터링 실패:', error);
      return fullSpec;
    }
  }

  /**
   * 경로가 사용자 선택에 포함되는지 확인합니다
   * @param {string} path 
   * @param {Array} selectedPaths 
   * @returns {boolean}
   */
  isPathSelected(path, selectedPaths) {
    if (!Array.isArray(selectedPaths)) {
      return true;
    }

    return selectedPaths.some(selected => {
      return selected.path === path || 
             selected.id === path ||
             selected === path;
    });
  }

  /**
   * 캐시를 무효화합니다
   * @param {string} key 캐시 키 (없으면 전체 캐시 삭제)
   */
  invalidateCache(key = null) {
    if (key) {
      this.cachedSpecs.delete(key);
    } else {
      this.cachedSpecs.clear();
    }
  }

  /**
   * 스펙에서 태그 목록을 추출합니다
   * @param {Object} spec 
   * @returns {Array}
   */
  extractTagsFromSpec(spec) {
    if (!spec || !spec.paths) {
      return [];
    }

    const tags = new Set();
    
    Object.values(spec.paths).forEach(pathObj => {
      Object.values(pathObj).forEach(operation => {
        if (operation.tags && Array.isArray(operation.tags)) {
          operation.tags.forEach(tag => tags.add(tag));
        }
      });
    });

    return Array.from(tags);
  }
}