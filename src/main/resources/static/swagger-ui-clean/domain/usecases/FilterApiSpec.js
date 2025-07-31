import { SwaggerSpec } from '../entities/SwaggerSpec.js';

/**
 * API 스펙 필터링 유스케이스
 * 스웨거 스펙을 다양한 조건으로 필터링하는 비즈니스 로직을 담당합니다.
 */
export class FilterApiSpecUseCase {
  constructor(storageAdapter) {
    this.storageAdapter = storageAdapter;
  }

  /**
   * 사용자가 선택한 경로에 따라 API 스펙을 필터링합니다.
   * 
   * @param {SwaggerSpec} originalSpec 원본 스펙
   * @param {Array} usedPathList 사용자 선택 경로 목록
   * @returns {SwaggerSpec} 필터링된 스펙
   */
  execute(originalSpec, usedPathList = null) {
    if (!originalSpec || !originalSpec.isValid()) {
      throw new Error('Invalid original API spec provided');
    }

    // 사용자 선택 경로가 없으면 빈 스펙 반환
    if (!usedPathList) {
      usedPathList = this.getUserSelectedPaths();
    }

    return originalSpec.filterByUsedPaths(usedPathList);
  }

  /**
   * 로컬 스토리지에서 사용자 선택 경로 조회
   * 
   * @returns {Array|null}
   */
  getUserSelectedPaths() {
    try {
      const usedPathData = this.storageAdapter.getItem("usedPath");
      return usedPathData ? JSON.parse(usedPathData) : null;
    } catch (error) {
      console.warn('Failed to parse user selected paths:', error);
      return null;
    }
  }

  /**
   * 사용자 선택 경로를 로컬 스토리지에 저장
   * 
   * @param {Array} pathList 
   */
  saveUserSelectedPaths(pathList) {
    try {
      if (!Array.isArray(pathList)) {
        throw new Error('Path list must be an array');
      }

      this.storageAdapter.setItem("usedPath", JSON.stringify(pathList));
    } catch (error) {
      throw new Error(`Failed to save user selected paths: ${error.message}`);
    }
  }

  /**
   * 특정 태그들로 API 스펙 필터링
   * 
   * @param {SwaggerSpec} originalSpec 
   * @param {Array<string>} tags 
   * @returns {SwaggerSpec}
   */
  filterByTags(originalSpec, tags) {
    if (!originalSpec || !originalSpec.isValid()) {
      throw new Error('Invalid original API spec provided');
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return new SwaggerSpec();
    }

    return originalSpec.filterByTags(tags);
  }

  /**
   * 경로 패턴으로 API 스펙 필터링
   * 
   * @param {SwaggerSpec} originalSpec 
   * @param {Array<string>} pathPatterns 
   * @returns {SwaggerSpec}
   */
  filterByPathPatterns(originalSpec, pathPatterns) {
    if (!originalSpec || !originalSpec.isValid()) {
      throw new Error('Invalid original API spec provided');
    }

    if (!Array.isArray(pathPatterns) || pathPatterns.length === 0) {
      return originalSpec.clone();
    }

    return originalSpec.filterByPaths(pathPatterns);
  }

  /**
   * 원본 스펙에서 Raw 스펙 데이터 추출
   * 
   * @param {SwaggerSpec} originalSpec 
   * @param {Array} usedPathList 
   * @returns {Array}
   */
  extractRawSpecData(originalSpec, usedPathList) {
    const rawSpec = [];

    if (!usedPathList || usedPathList.length === 0) {
      return rawSpec;
    }

    originalSpec.forEachPath((path, method, operation) => {
      const pathParts = path.split("/");
      const isMatch = usedPathList.some(entry => {
        const targetMethod = entry.method.toLowerCase();
        const composedPath = `/api/${entry.rootPath}/${entry.subPath}`.replace(/\/+/g, "/");
        return (
          method.toLowerCase() === targetMethod &&
          path === composedPath &&
          operation.tags?.includes(entry.rootTagName)
        );
      });

      if (isMatch) {
        rawSpec.push({
          rootTagName: operation.tags?.[0],
          subTagName: operation.operationId + pathParts[2],
          method,
          rootPath: pathParts[2],
          subPath: pathParts[3],
          operation
        });
      }
    });

    return rawSpec;
  }

  /**
   * 필터링 결과 검증
   * 
   * @param {SwaggerSpec} filteredSpec 
   * @param {Array} expectedPaths 
   * @returns {boolean}
   */
  validateFilteringResult(filteredSpec, expectedPaths) {
    if (!filteredSpec || !filteredSpec.isValid()) {
      return false;
    }

    if (!Array.isArray(expectedPaths)) {
      return true;
    }

    const filteredPathCount = filteredSpec.getPathCount();
    return filteredPathCount <= expectedPaths.length;
  }

  /**
   * 필터링 통계 생성
   * 
   * @param {SwaggerSpec} originalSpec 
   * @param {SwaggerSpec} filteredSpec 
   * @returns {Object}
   */
  generateFilteringStats(originalSpec, filteredSpec) {
    return {
      originalPaths: originalSpec.getPathCount(),
      filteredPaths: filteredSpec.getPathCount(),
      originalOperations: originalSpec.getOperationCount(),
      filteredOperations: filteredSpec.getOperationCount(),
      originalTags: originalSpec.getTags().length,
      filteredTags: filteredSpec.getTags().length,
      filterRatio: originalSpec.getPathCount() > 0 
        ? (filteredSpec.getPathCount() / originalSpec.getPathCount() * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 북마크된 API들로 필터링
   * 
   * @param {SwaggerSpec} originalSpec 
   * @returns {SwaggerSpec}
   */
  filterByBookmarks(originalSpec) {
    const bookmarks = this.getBookmarks();
    if (!bookmarks || bookmarks.length === 0) {
      return new SwaggerSpec();
    }

    return this.execute(originalSpec, bookmarks);
  }

  /**
   * 북마크 목록 조회
   * 
   * @returns {Array}
   */
  getBookmarks() {
    try {
      const bookmarkData = this.storageAdapter.getItem("bookmarks");
      return bookmarkData ? JSON.parse(bookmarkData) : [];
    } catch (error) {
      console.warn('Failed to get bookmarks:', error);
      return [];
    }
  }

  /**
   * 북마크 저장
   * 
   * @param {Array} bookmarks 
   */
  saveBookmarks(bookmarks) {
    try {
      if (!Array.isArray(bookmarks)) {
        throw new Error('Bookmarks must be an array');
      }

      this.storageAdapter.setItem("bookmarks", JSON.stringify(bookmarks));
    } catch (error) {
      throw new Error(`Failed to save bookmarks: ${error.message}`);
    }
  }

  /**
   * 필터링 옵션 초기화
   */
  clearFilteringOptions() {
    try {
      this.storageAdapter.removeItem("usedPath");
      this.storageAdapter.removeItem("bookmarks");
    } catch (error) {
      console.warn('Failed to clear filtering options:', error);
    }
  }
}