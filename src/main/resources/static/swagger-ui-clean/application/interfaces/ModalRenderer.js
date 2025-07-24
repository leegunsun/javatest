/**
 * 모달 렌더링을 위한 인터페이스
 */
export class ModalRenderer {
  /**
   * 카테고리 리스트를 렌더링합니다
   * @param {Array} bookmarkedApis 
   */
  renderCategoryList(bookmarkedApis) {
    throw new Error('Method must be implemented');
  }

  /**
   * 서브카테고리들을 렌더링합니다
   * @param {Array} subcategories 
   */
  renderSubcategories(subcategories) {
    throw new Error('Method must be implemented');
  }

  /**
   * 선택된 항목들을 렌더링합니다
   * @param {Array} selectedItems 
   */
  renderSelectedItems(selectedItems) {
    throw new Error('Method must be implemented');
  }

  /**
   * 모달을 초기화합니다
   */
  clear() {
    throw new Error('Method must be implemented');
  }
}