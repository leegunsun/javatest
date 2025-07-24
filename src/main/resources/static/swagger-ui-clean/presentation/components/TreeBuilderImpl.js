import { TreeBuilder } from '../../application/interfaces/TreeBuilder.js';

/**
 * 트리 구조 생성 구현체
 */
export class TreeBuilderImpl extends TreeBuilder {
  /**
   * 그룹화된 리스트를 트리 구조로 변환합니다
   * @param {Array} groupedList 
   * @returns {Object}
   */
  buildTree(groupedList) {
    if (!Array.isArray(groupedList)) {
      return { children: [] };
    }

    const tree = {
      children: []
    };

    groupedList.forEach(group => {
      const groupNode = this.createGroupNode(group);
      tree.children.push(groupNode);
    });

    return tree;
  }

  /**
   * 그룹 노드를 생성합니다
   * @param {Object} group 
   * @returns {Object}
   */
  createGroupNode(group) {
    return {
      id: group.group,
      name: group.group,
      description: group.description || '',
      type: 'group',
      data: group,
      children: [],
      isExpanded: false,
      isDraggable: true
    };
  }

  /**
   * 노드를 트리에 추가합니다
   * @param {Object} tree 
   * @param {Object} node 
   */
  addNode(tree, node) {
    if (!tree.children) {
      tree.children = [];
    }
    
    tree.children.push(node);
  }

  /**
   * 트리에서 노드를 제거합니다
   * @param {Object} tree 
   * @param {string} nodeId 
   */
  removeNode(tree, nodeId) {
    if (!tree.children) {
      return;
    }

    tree.children = tree.children.filter(child => {
      if (child.id === nodeId) {
        return false;
      }
      
      // 재귀적으로 자식 노드도 확인
      if (child.children) {
        this.removeNode(child, nodeId);
      }
      
      return true;
    });
  }

  /**
   * 노드를 찾습니다
   * @param {Object} tree 
   * @param {string} nodeId 
   * @returns {Object|null}
   */
  findNode(tree, nodeId) {
    if (tree.id === nodeId) {
      return tree;
    }

    if (tree.children) {
      for (const child of tree.children) {
        const found = this.findNode(child, nodeId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * 노드를 업데이트합니다
   * @param {Object} tree 
   * @param {string} nodeId 
   * @param {Object} updateData 
   */
  updateNode(tree, nodeId, updateData) {
    const node = this.findNode(tree, nodeId);
    if (node) {
      Object.assign(node, updateData);
    }
  }

  /**
   * 트리를 평면화합니다
   * @param {Object} tree 
   * @returns {Array}
   */
  flattenTree(tree) {
    const result = [];
    
    const traverse = (node, level = 0) => {
      result.push({ ...node, level });
      
      if (node.children && node.isExpanded) {
        node.children.forEach(child => traverse(child, level + 1));
      }
    };

    if (tree.children) {
      tree.children.forEach(child => traverse(child));
    }

    return result;
  }

  /**
   * 트리의 깊이를 계산합니다
   * @param {Object} tree 
   * @returns {number}
   */
  getTreeDepth(tree) {
    if (!tree.children || tree.children.length === 0) {
      return 0;
    }

    return 1 + Math.max(...tree.children.map(child => this.getTreeDepth(child)));
  }

  /**
   * 트리의 총 노드 개수를 계산합니다
   * @param {Object} tree 
   * @returns {number}
   */
  getNodeCount(tree) {
    let count = 0;
    
    const traverse = (node) => {
      count += 1;
      if (node.children) {
        node.children.forEach(child => traverse(child));
      }
    };

    if (tree.children) {
      tree.children.forEach(child => traverse(child));
    }

    return count;
  }
}