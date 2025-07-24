/**
 * 사이드바 관리 유스케이스
 */
export class ManageSidebarUseCase {
  constructor(sidebarStateRepository, treeBuilder, sidebarRenderer) {
    this.sidebarStateRepository = sidebarStateRepository;
    this.treeBuilder = treeBuilder;
    this.sidebarRenderer = sidebarRenderer;
  }

  /**
   * 사이드바를 초기화합니다
   * @param {Array} groupedList 
   * @param {HTMLElement} container 
   */
  async initializeSidebar(groupedList, container) {
    try {
      // 트리 구조 생성
      const tree = this.treeBuilder.buildTree(groupedList);
      
      // 사이드바 렌더링
      this.sidebarRenderer.render(tree, container);
      
      // 이벤트 리스너 설정
      this.setupSidebarEventListeners();
      
    } catch (error) {
      console.error('사이드바 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 사이드바 토글 기능을 실행합니다
   * @returns {boolean} 토글 후 상태 (true: collapsed, false: expanded)
   */
  async toggleSidebar() {
    try {
      const sidebarState = await this.sidebarStateRepository.getSidebarState();
      const newState = sidebarState.toggle();
      
      await this.sidebarStateRepository.saveSidebarState(sidebarState);
      
      // UI 업데이트
      this.updateSidebarUI(sidebarState);
      
      return newState;
    } catch (error) {
      console.error('사이드바 토글 실패:', error);
      throw error;
    }
  }

  /**
   * 사이드바 UI를 업데이트합니다
   * @param {SidebarState} sidebarState 
   */
  updateSidebarUI(sidebarState) {
    const sidebar = document.querySelector('.sidebar');
    const swaggerUi = document.querySelector('#swagger-ui');
    const toggleBtn = document.querySelector('#toggle-sidebar-btn');

    if (!sidebar || !swaggerUi || !toggleBtn) return;

    const cssClasses = sidebarState.getCssClasses();
    
    // CSS 클래스 적용
    if (sidebarState.isCollapsed) {
      sidebar.classList.add('collapsed');
      swaggerUi.classList.add('sidebar-collapsed');
    } else {
      sidebar.classList.remove('collapsed');
      swaggerUi.classList.remove('sidebar-collapsed');
    }

    // 버튼 텍스트 업데이트
    toggleBtn.innerText = sidebarState.getToggleButtonText();
  }

  /**
   * 사이드바 관련 이벤트 리스너들을 설정합니다
   */
  setupSidebarEventListeners() {
    const toggleBtn = document.querySelector('#toggle-sidebar-btn');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }
  }

  /**
   * 사이드바 상태를 복원합니다
   */
  async restoreSidebarState() {
    try {
      const sidebarState = await this.sidebarStateRepository.getSidebarState();
      this.updateSidebarUI(sidebarState);
    } catch (error) {
      console.error('사이드바 상태 복원 실패:', error);
    }
  }
}