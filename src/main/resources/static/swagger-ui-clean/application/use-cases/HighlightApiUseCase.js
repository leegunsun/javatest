/**
 * API 하이라이트 유스케이스
 */
export class HighlightApiUseCase {
  constructor(
    apiHighlightService,
    apiStatusRepository,
    highlightRenderer
  ) {
    this.apiHighlightService = apiHighlightService;
    this.apiStatusRepository = apiStatusRepository;
    this.highlightRenderer = highlightRenderer;
  }

  /**
   * 모든 API 하이라이트를 적용합니다
   */
  async highlightAll() {
    try {
      await Promise.all([
        this.highlightApiStatus(),
        this.highlightNewApis(),
        this.highlightBookmarkedApis()
      ]);
      
      // 새로운 API 개수 업데이트
      await this.updateNewApiCounter();
      
    } catch (error) {
      console.error('API 하이라이트 적용 실패:', error);
      throw error;
    }
  }

  /**
   * API 상태에 따른 하이라이트를 적용합니다
   */
  async highlightApiStatus() {
    try {
      const statusMap = await this.apiStatusRepository.getApiStatusMap();
      
      // DOM에서 모든 API 블록 찾기
      const apiBlocks = document.querySelectorAll('.opblock');
      
      apiBlocks.forEach(block => {
        const path = this.extractApiPath(block);
        const status = statusMap[path];
        
        if (status) {
          this.highlightRenderer.applyStatusHighlight(block, status);
        }
      });
      
    } catch (error) {
      console.error('API 상태 하이라이트 실패:', error);
    }
  }

  /**
   * 새로운 API들을 하이라이트합니다
   */
  async highlightNewApis() {
    try {
      const createdDateMap = await this.apiStatusRepository.getApiCreatedDateMap();
      const apiBlocks = document.querySelectorAll('.opblock');
      
      let newApiCount = 0;
      
      apiBlocks.forEach(block => {
        const path = this.extractApiPath(block);
        const createdDate = createdDateMap[path];
        
        if (createdDate && this.apiHighlightService.isNewApi({ createdDate })) {
          this.highlightRenderer.applyNewApiHighlight(block);
          newApiCount++;
        }
      });
      
      // 새로운 API 카운터 업데이트
      this.updateNewApiCounterDisplay(newApiCount);
      
    } catch (error) {
      console.error('새 API 하이라이트 실패:', error);
    }
  }

  /**
   * 북마크된 API들을 하이라이트합니다
   */
  async highlightBookmarkedApis() {
    try {
      const bookmarkService = new (await import('../../domain/services/BookmarkService.js')).BookmarkService();
      const bookmarkedApis = bookmarkService.getBookmarkedApis();
      
      const apiBlocks = document.querySelectorAll('.opblock');
      
      apiBlocks.forEach(block => {
        const path = this.extractApiPath(block);
        
        if (bookmarkedApis.includes(path)) {
          this.highlightRenderer.applyBookmarkHighlight(block);
        }
      });
      
    } catch (error) {
      console.error('북마크 API 하이라이트 실패:', error);
    }
  }

  /**
   * 새로운 API 개수를 업데이트합니다
   */
  async updateNewApiCounter() {
    try {
      const createdDateMap = await this.apiStatusRepository.getApiCreatedDateMap();
      const paths = Object.keys(createdDateMap);
      
      const newApiCount = paths.filter(path => {
        const createdDate = createdDateMap[path];
        return this.apiHighlightService.isNewApi({ createdDate });
      }).length;
      
      this.updateNewApiCounterDisplay(newApiCount);
      
    } catch (error) {
      console.error('새 API 카운터 업데이트 실패:', error);
    }
  }

  /**
   * 새로운 API 카운터 표시를 업데이트합니다
   * @param {number} count 
   */
  updateNewApiCounterDisplay(count) {
    const counter = document.getElementById('new-api-counter');
    if (counter) {
      counter.textContent = `NEW API: ${count}개`;
    }
  }

  /**
   * API 블록에서 API 경로를 추출합니다
   * @param {HTMLElement} block 
   * @returns {string}
   */
  extractApiPath(block) {
    try {
      // opblock-summary-path에서 경로 추출
      const pathElement = block.querySelector('.opblock-summary-path');
      if (pathElement) {
        return pathElement.textContent.trim();
      }
      
      // 대안적인 방법으로 데이터 속성에서 추출
      const path = block.getAttribute('data-path') || 
                   block.getAttribute('data-tag') ||
                   '';
      
      return path;
    } catch (error) {
      console.error('API 경로 추출 실패:', error);
      return '';
    }
  }

  /**
   * 특정 API에 대한 하이라이트를 제거합니다
   * @param {string} apiPath 
   */
  removeHighlight(apiPath) {
    try {
      const apiBlocks = document.querySelectorAll('.opblock');
      
      apiBlocks.forEach(block => {
        const path = this.extractApiPath(block);
        
        if (path === apiPath) {
          this.highlightRenderer.removeAllHighlights(block);
        }
      });
      
    } catch (error) {
      console.error('하이라이트 제거 실패:', error);
    }
  }
}