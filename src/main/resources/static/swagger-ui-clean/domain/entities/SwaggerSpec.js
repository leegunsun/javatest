/**
 * Swagger 스펙 엔터티
 * OpenAPI 스펙 데이터를 관리하는 도메인 엔터티입니다.
 */
export class SwaggerSpec {
  constructor(spec = {}) {
    this.openapi = spec.openapi || "3.0.0";
    this.info = spec.info || {};
    this.servers = spec.servers || [];
    this.tags = spec.tags || [];
    this.paths = spec.paths || {};
    this.components = spec.components || {};
  }

  /**
   * 스펙 정보 반환
   */
  getInfo() {
    return this.info;
  }

  /**
   * 서버 목록 반환
   */
  getServers() {
    return this.servers;
  }

  /**
   * 태그 목록 반환
   */
  getTags() {
    return this.tags;
  }

  /**
   * 경로 목록 반환
   */
  getPaths() {
    return this.paths;
  }

  /**
   * 컴포넌트 반환
   */
  getComponents() {
    return this.components;
  }

  /**
   * 특정 경로의 메서드 반환
   */
  getPathMethods(path) {
    return this.paths[path] || {};
  }

  /**
   * 특정 경로와 메서드의 작업 반환
   */
  getOperation(path, method) {
    const pathMethods = this.getPathMethods(path);
    return pathMethods[method.toLowerCase()];
  }

  /**
   * 모든 경로를 순회하며 작업 실행
   */
  forEachPath(callback) {
    Object.entries(this.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        callback(path, method, operation);
      });
    });
  }

  /**
   * 특정 태그의 경로들만 필터링
   */
  filterByTags(targetTags) {
    const filteredPaths = {};
    const usedTags = new Set();

    Object.entries(this.paths).forEach(([path, methods]) => {
      const filteredMethods = {};

      Object.entries(methods).forEach(([method, operation]) => {
        if (operation.tags && operation.tags.some(tag => targetTags.includes(tag))) {
          filteredMethods[method] = operation;
          operation.tags.forEach(tag => usedTags.add(tag));
        }
      });

      if (Object.keys(filteredMethods).length > 0) {
        filteredPaths[path] = filteredMethods;
      }
    });

    return new SwaggerSpec({
      ...this.toJSON(),
      tags: this.tags.filter(tag => usedTags.has(tag.name)),
      paths: filteredPaths
    });
  }

  /**
   * 특정 경로 패턴으로 필터링
   */
  filterByPaths(pathPatterns) {
    const filteredPaths = {};
    const pathRegexes = pathPatterns.map(pattern => new RegExp(pattern));

    Object.entries(this.paths).forEach(([path, methods]) => {
      if (pathRegexes.some(regex => regex.test(path))) {
        filteredPaths[path] = methods;
      }
    });

    return new SwaggerSpec({
      ...this.toJSON(),
      paths: filteredPaths
    });
  }

  /**
   * 사용자 정의 경로 목록으로 필터링
   */
  filterByUsedPaths(usedPathList) {
    if (!usedPathList || usedPathList.length === 0) {
      return new SwaggerSpec({
        ...this.toJSON(),
        tags: [],
        paths: {}
      });
    }

    const filteredPaths = {};
    const tagSet = new Set();

    Object.entries(this.paths).forEach(([path, methods]) => {
      const filteredMethods = {};

      Object.entries(methods).forEach(([method, operation]) => {
        const normalizedMethod = method.toLowerCase();
        const pathParts = path.split("/");

        const isMatch = usedPathList.some(entry => {
          const targetMethod = entry.method.toLowerCase();
          const composedPath = `/api/${entry.rootPath}/${entry.subPath}`.replace(/\/+/g, "/");
          return (
            normalizedMethod === targetMethod &&
            path === composedPath &&
            operation.tags?.includes(entry.rootTagName)
          );
        });

        if (isMatch) {
          filteredMethods[method] = operation;
          operation.tags?.forEach(tag => tagSet.add(tag));
        }
      });

      if (Object.keys(filteredMethods).length > 0) {
        filteredPaths[path] = filteredMethods;
      }
    });

    return new SwaggerSpec({
      ...this.toJSON(),
      tags: [...tagSet].map(tag => ({ name: tag })),
      paths: filteredPaths
    });
  }

  /**
   * 빈 스펙인지 확인
   */
  isEmpty() {
    return Object.keys(this.paths).length === 0;
  }

  /**
   * 유효한 스펙인지 확인
   */
  isValid() {
    return this.openapi && this.info && typeof this.paths === 'object';
  }

  /**
   * 경로 개수 반환
   */
  getPathCount() {
    return Object.keys(this.paths).length;
  }

  /**
   * 작업(operation) 개수 반환
   */
  getOperationCount() {
    let count = 0;
    this.forEachPath(() => count++);
    return count;
  }

  /**
   * 태그별 작업 개수 반환
   */
  getOperationCountByTag() {
    const tagCounts = {};
    
    this.forEachPath((path, method, operation) => {
      if (operation.tags) {
        operation.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return tagCounts;
  }

  /**
   * 스펙 복사본 생성
   */
  clone() {
    return new SwaggerSpec(JSON.parse(JSON.stringify(this.toJSON())));
  }

  /**
   * JSON으로 직렬화
   */
  toJSON() {
    return {
      openapi: this.openapi,
      info: this.info,
      servers: this.servers,
      tags: this.tags,
      paths: this.paths,
      components: this.components
    };
  }

  /**
   * JSON에서 SwaggerSpec 인스턴스 생성
   */
  static fromJSON(json) {
    return new SwaggerSpec(json);
  }

  /**
   * 여러 스펙을 병합
   */
  static merge(specs) {
    const merged = {
      openapi: "3.0.0",
      info: { title: "Merged API", version: "1.0.0" },
      servers: [],
      tags: [],
      paths: {},
      components: {}
    };

    const tagNames = new Set();
    
    specs.forEach(spec => {
      Object.assign(merged.paths, spec.getPaths());
      
      spec.getTags().forEach(tag => {
        if (!tagNames.has(tag.name)) {
          merged.tags.push(tag);
          tagNames.add(tag.name);
        }
      });

      if (spec.getServers().length > 0 && merged.servers.length === 0) {
        merged.servers = spec.getServers();
      }
    });

    return new SwaggerSpec(merged);
  }
}