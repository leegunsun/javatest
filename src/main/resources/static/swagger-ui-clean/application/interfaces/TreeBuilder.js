/**
 * 트리 구조 생성을 위한 인터페이스
 */
export class TreeBuilder {
  /**
   * 그룹화된 리스트를 트리 구조로 변환합니다
   * @param {Array} groupedList 
   * @returns {Object}
   */
  buildTree(groupedList) {
    throw new Error('Method must be implemented');
  }

  /**
   * 노드를 트리에 추가합니다
   * @param {Object} tree 
   * @param {Object} node 
   */
  addNode(tree, node) {
    throw new Error('Method must be implemented');
  }

  /**
   * 트리에서 노드를 제거합니다
   * @param {Object} tree 
   * @param {string} nodeId 
   */
  removeNode(tree, nodeId) {
    throw new Error('Method must be implemented');
  }
}