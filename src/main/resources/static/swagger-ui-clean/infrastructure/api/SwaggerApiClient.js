/**
 * Swagger API 클라이언트
 * 외부 API와의 통신을 담당하는 인프라스트럭처 계층 컴포넌트입니다.
 */
export class SwaggerApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * HTTP 요청을 수행합니다.
   * 
   * @param {string} url 요청 URL
   * @param {Object} options 요청 옵션
   * @returns {Promise<any>} 응답 데이터
   */
  async request(url, options = {}) {
    const fullUrl = this.buildUrl(url);
    const requestOptions = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(fullUrl, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error(`API request failed for ${fullUrl}:`, error);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * GET 요청을 수행합니다.
   * 
   * @param {string} url 요청 URL
   * @param {Object} headers 추가 헤더
   * @returns {Promise<any>} 응답 데이터
   */
  async get(url, headers = {}) {
    return this.request(url, {
      method: 'GET',
      headers
    });
  }

  /**
   * POST 요청을 수행합니다.
   * 
   * @param {string} url 요청 URL
   * @param {any} data 요청 데이터
   * @param {Object} headers 추가 헤더
   * @returns {Promise<any>} 응답 데이터
   */
  async post(url, data, headers = {}) {
    return this.request(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
  }

  /**
   * API 상태 데이터를 조회합니다.
   * 
   * @returns {Promise<Object>} API 상태 맵
   */
  async getApiStatus() {
    return this.get('/swagger-status/api-status.json');
  }

  /**
   * API 메타데이터를 조회합니다.
   * 
   * @returns {Promise<Object>} API 메타데이터
   */
  async getApiMetadata() {
    return this.get('/swagger-status/api-meta.json');
  }

  /**
   * 그룹화된 API 목록을 조회합니다.
   * 
   * @returns {Promise<Array>} 그룹화된 API 목록
   */
  async getGroupedList() {
    return this.get('/swagger-status/grouped-openapi-list');
  }

  /**
   * 특정 그룹의 API 스펙을 조회합니다.
   * 
   * @param {string} groupName 그룹명
   * @returns {Promise<Object>} API 스펙
   */
  async getApiSpec(groupName) {
    if (!groupName) {
      throw new Error('Group name is required');
    }
    return this.get(`/v3/api-docs/${groupName}`);
  }

  /**
   * 필터링된 API 스펙을 조회합니다.
   * 
   * @returns {Promise<Object>} 필터링된 API 스펙
   */
  async getFilteredApiSpec() {
    return this.get('/v3/api-docs/filtered-api');
  }

  /**
   * 모든 API 데이터를 병렬로 조회합니다.
   * 
   * @returns {Promise<Object>} 모든 API 데이터
   */
  async fetchAllApiData() {
    try {
      const [statusMap, createdMap, groupedList] = await Promise.all([
        this.getApiStatus(),
        this.getApiMetadata(), 
        this.getGroupedList()
      ]);

      return {
        statusMap,
        createdMap,
        groupedList
      };
    } catch (error) {
      console.error('Failed to fetch all API data:', error);
      throw error;
    }
  }

  /**
   * API 연결 상태를 확인합니다.
   * 
   * @returns {Promise<boolean>} 연결 상태
   */
  async checkConnection() {
    try {
      await this.get('/swagger-status/api-status.json');
      return true;
    } catch (error) {
      console.warn('API connection check failed:', error);
      return false;
    }
  }

  /**
   * 요청 재시도 로직
   * 
   * @param {Function} requestFn 요청 함수
   * @param {number} maxRetries 최대 재시도 횟수
   * @param {number} delay 재시도 간격(ms)
   * @returns {Promise<any>} 응답 데이터
   */
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        console.warn(`Request attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await this.sleep(delay * attempt);
        }
      }
    }

    throw new Error(`Request failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * 지연 실행 유틸리티
   * 
   * @param {number} ms 밀리초
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * URL 빌드
   * 
   * @param {string} path 경로
   * @returns {string} 완전한 URL
   */
  buildUrl(path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    if (path.startsWith('/')) {
      return this.baseUrl + path;
    }

    return this.baseUrl + '/' + path;
  }

  /**
   * 요청 타임아웃 설정
   * 
   * @param {string} url 요청 URL
   * @param {Object} options 요청 옵션
   * @param {number} timeout 타임아웃(ms)
   * @returns {Promise<Response>}
   */
  async requestWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * 요청 인터셉터 설정
   * 
   * @param {Function} interceptor 인터셉터 함수
   */
  setRequestInterceptor(interceptor) {
    this.requestInterceptor = interceptor;
  }

  /**
   * 응답 인터셉터 설정
   * 
   * @param {Function} interceptor 인터셉터 함수  
   */
  setResponseInterceptor(interceptor) {
    this.responseInterceptor = interceptor;
  }

  /**
   * 에러 핸들러 설정
   * 
   * @param {Function} handler 에러 핸들러 함수
   */
  setErrorHandler(handler) {
    this.errorHandler = handler;
  }

  /**
   * 클라이언트 설정 초기화
   */
  reset() {
    this.requestInterceptor = null;
    this.responseInterceptor = null;
    this.errorHandler = null;
  }
}