/**
 * API 하이라이트 렌더링을 위한 인터페이스
 */
export class HighlightRenderer {
  /**
   * API 상태에 따른 하이라이트를 적용합니다
   * @param {HTMLElement} block 
   * @param {string} status 
   */
  applyStatusHighlight(block, status) {
    throw new Error('Method must be implemented');
  }

  /**
   * 새로운 API 하이라이트를 적용합니다
   * @param {HTMLElement} block 
   */
  applyNewApiHighlight(block) {
    throw new Error('Method must be implemented');
  }

  /**
   * 북마크 하이라이트를 적용합니다
   * @param {HTMLElement} block 
   */
  applyBookmarkHighlight(block) {
    throw new Error('Method must be implemented');
  }

  /**
   * 모든 하이라이트를 제거합니다
   * @param {HTMLElement} block 
   */
  removeAllHighlights(block) {
    throw new Error('Method must be implemented');
  }

  /**
   * 상태 배지를 추가합니다
   * @param {HTMLElement} block 
   * @param {string} status 
   */
  addStatusBadge(block, status) {
    throw new Error('Method must be implemented');
  }
}