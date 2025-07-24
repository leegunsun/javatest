import { SidebarRenderer } from '../../application/interfaces/SidebarRenderer.js';

/**
 * 사이드바 렌더링 구현체
 */
export class SidebarRendererImpl extends SidebarRenderer {
  constructor(initializeSwaggerUseCase) {
    super();
    this.initializeSwaggerUseCase = initializeSwaggerUseCase;
  }

  /**
   * 트리 구조를 사이드바에 렌더링합니다
   * @param {Object} tree 
   * @param {HTMLElement} container 
   */
  render(tree, container) {
    if (!container) {
      console.error('사이드바 컨테이너가 없습니다');
      return;
    }

    this.clear(container);

    if (!tree.children || tree.children.length === 0) {
      this.renderEmptyState(container);
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'api-tree-list';

    tree.children.forEach(groupNode => {
      const li = this.createGroupElement(groupNode);
      ul.appendChild(li);
    });

    container.appendChild(ul);
  }

  /**
   * 그룹 요소를 생성합니다
   * @param {Object} groupNode 
   * @returns {HTMLElement}
   */
  createGroupElement(groupNode) {
    const li = document.createElement('li');
    li.className = 'api-group-item';
    li.dataset.groupId = groupNode.id;

    const wrapper = document.createElement('div');
    wrapper.className = 'node-wrapper';

    // 드래그 핸들러
    const dragHandler = document.createElement('span');
    dragHandler.className = 'node-drag-handler';
    dragHandler.textContent = '⋮⋮';
    dragHandler.title = '드래그하여 순서 변경';

    // 그룹 타이틀
    const title = document.createElement('span');
    title.className = 'node-title';
    title.textContent = groupNode.name;
    title.title = groupNode.description;

    // 클릭 이벤트 추가
    title.addEventListener('click', () => {
      this.handleGroupClick(groupNode);
    });

    wrapper.appendChild(dragHandler);
    wrapper.appendChild(title);
    li.appendChild(wrapper);

    // 드래그 앤 드롭 이벤트 설정
    this.setupDragAndDrop(li, groupNode);

    return li;
  }

  /**
   * 그룹 클릭 핸들러
   * @param {Object} groupNode 
   */
  async handleGroupClick(groupNode) {
    try {
      // 다른 그룹 비활성화
      document.querySelectorAll('.api-group-item').forEach(item => {
        item.classList.remove('active');
      });

      // 현재 그룹 활성화
      const currentElement = document.querySelector(`[data-group-id="${groupNode.id}"]`);
      if (currentElement) {
        currentElement.classList.add('active');
      }

      // Swagger UI 로드
      if (this.initializeSwaggerUseCase) {
        await this.initializeSwaggerUseCase.execute(groupNode.id);
      }

    } catch (error) {
      console.error('그룹 클릭 처리 실패:', error);
    }
  }

  /**
   * 드래그 앤 드롭 기능을 설정합니다
   * @param {HTMLElement} element 
   * @param {Object} nodeData 
   */
  setupDragAndDrop(element, nodeData) {
    element.draggable = true;

    element.addEventListener('dragstart', (e) => {
      element.classList.add('dragging');
      e.dataTransfer.setData('text/plain', nodeData.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    element.addEventListener('dragend', () => {
      element.classList.remove('dragging');
    });

    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (!element.classList.contains('dragging')) {
        element.classList.add('drag-over');
      }
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');
      
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = nodeData.id;
      
      if (draggedId !== targetId) {
        this.handleNodeReorder(draggedId, targetId);
      }
    });
  }

  /**
   * 노드 순서 변경을 처리합니다
   * @param {string} draggedId 
   * @param {string} targetId 
   */
  handleNodeReorder(draggedId, targetId) {
    try {
      console.log(`노드 순서 변경: ${draggedId} -> ${targetId}`);
      // 실제 순서 변경 로직 구현
      // 이 부분은 데이터 저장 로직과 연결되어야 함
    } catch (error) {
      console.error('노드 순서 변경 실패:', error);
    }
  }

  /**
   * 사이드바 노드를 업데이트합니다
   * @param {string} nodeId 
   * @param {Object} nodeData 
   */
  updateNode(nodeId, nodeData) {
    const element = document.querySelector(`[data-group-id="${nodeId}"]`);
    if (!element) return;

    const titleElement = element.querySelector('.node-title');
    if (titleElement) {
      titleElement.textContent = nodeData.name || nodeId;
      titleElement.title = nodeData.description || '';
    }
  }

  /**
   * 사이드바를 초기화합니다
   * @param {HTMLElement} container 
   */
  clear(container) {
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * 빈 상태를 렌더링합니다
   * @param {HTMLElement} container 
   */
  renderEmptyState(container) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'api-tree-empty';
    emptyDiv.innerHTML = `
      <div class="empty-icon">📁</div>
      <div class="empty-text">API 그룹이 없습니다</div>
    `;
    container.appendChild(emptyDiv);
  }

  /**
   * 로딩 상태를 표시합니다
   * @param {HTMLElement} container 
   */
  renderLoadingState(container) {
    this.clear(container);
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'api-tree-loading';
    loadingDiv.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">API 그룹을 로드하는 중...</div>
    `;
    container.appendChild(loadingDiv);
  }

  /**
   * 에러 상태를 표시합니다
   * @param {HTMLElement} container 
   * @param {string} errorMessage 
   */
  renderErrorState(container, errorMessage = '알 수 없는 오류가 발생했습니다') {
    this.clear(container);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'api-tree-error';
    errorDiv.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-text">${errorMessage}</div>
      <button class="retry-button" onclick="location.reload()">다시 시도</button>
    `;
    container.appendChild(errorDiv);
  }
}