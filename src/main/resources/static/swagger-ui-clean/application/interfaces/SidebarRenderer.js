/**
 * 사이드바 렌더링을 위한 인터페이스
 */
export class SidebarRenderer {
  /**
   * 트리 구조를 사이드바에 렌더링합니다
   * @param {Object} tree 
   * @param {HTMLElement} container 
   */
  render(tree, container) {
    throw new Error('Method must be implemented');
  }

  /**
   * 사이드바 노드를 업데이트합니다
   * @param {string} nodeId 
   * @param {Object} nodeData 
   */
  updateNode(nodeId, nodeData) {
    throw new Error('Method must be implemented');
  }

  /**
   * 사이드바를 초기화합니다
   * @param {HTMLElement} container 
   */
  clear(container) {
    throw new Error('Method must be implemented');
  }
}