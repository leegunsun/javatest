/**
 * 북마크 모달 관리 유스케이스
 */
export class ManageBookmarkModalUseCase {
  constructor(
    bookmarkService,
    swaggerRepository,
    modalStateRepository,
    modalRenderer
  ) {
    this.bookmarkService = bookmarkService;
    this.swaggerRepository = swaggerRepository;
    this.modalStateRepository = modalStateRepository;
    this.modalRenderer = modalRenderer;
  }

  /**
   * 북마크 모달을 엽니다
   */
  async openModal() {
    try {
      // 모달 상태 업데이트
      const modalState = await this.modalStateRepository.getModalState();
      modalState.open();
      
      // 필터링된 스웨거 스펙 로드
      await this.swaggerRepository.getFilteredSwaggerSpec();
      
      // 카테고리 리스트 렌더링
      const bookmarkedApis = this.bookmarkService.getBookmarkedApis();
      this.modalRenderer.renderCategoryList(bookmarkedApis);
      
      // 모달 표시
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.remove('hidden');
      }
      
      await this.modalStateRepository.saveModalState(modalState);
      
    } catch (error) {
      console.error('모달 열기 실패:', error);
      throw error;
    }
  }

  /**
   * 북마크 모달을 닫습니다
   */
  async closeModal() {
    try {
      // 모달 상태 업데이트
      const modalState = await this.modalStateRepository.getModalState();
      modalState.close();
      
      // 모달 숨김
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.add('hidden');
      }
      
      await this.modalStateRepository.saveModalState(modalState);
      
    } catch (error) {
      console.error('모달 닫기 실패:', error);
      throw error;
    }
  }

  /**
   * 카테고리를 선택합니다
   * @param {Object} category 
   */
  async selectCategory(category) {
    try {
      const modalState = await this.modalStateRepository.getModalState();
      modalState.selectCategory(category);
      
      // 서브카테고리 렌더링
      this.modalRenderer.renderSubcategories(category.subcategories || []);
      
      await this.modalStateRepository.saveModalState(modalState);
      
    } catch (error) {
      console.error('카테고리 선택 실패:', error);
      throw error;
    }
  }

  /**
   * 서브카테고리를 토글합니다
   * @param {Object} subcategory 
   */
  async toggleSubcategory(subcategory) {
    try {
      const modalState = await this.modalStateRepository.getModalState();
      modalState.toggleSubcategory(subcategory);
      
      // 선택된 항목들 렌더링 업데이트
      this.modalRenderer.renderSelectedItems(modalState.getSelectedSubcategoriesArray());
      
      await this.modalStateRepository.saveModalState(modalState);
      
    } catch (error) {
      console.error('서브카테고리 토글 실패:', error);
      throw error;
    }
  }

  /**
   * 북마크를 저장합니다
   */
  async saveBookmarks() {
    try {
      const modalState = await this.modalStateRepository.getModalState();
      const selectedItems = modalState.getSelectedSubcategoriesArray();
      
      // 기존 북마크 초기화
      this.bookmarkService.clearAllBookmarks();
      
      // 새로운 북마크 저장
      selectedItems.forEach(item => {
        this.bookmarkService.addBookmark(item.path || item.id);
      });
      
      // 모달 닫기
      await this.closeModal();
      
      // Swagger UI 새로고침
      await this.refreshSwaggerUI();
      
    } catch (error) {
      console.error('북마크 저장 실패:', error);
      throw error;
    }
  }

  /**
   * Swagger UI를 새로고침합니다
   */
  async refreshSwaggerUI() {
    try {
      // 커스텀 API로 Swagger 재로드
      const initializeSwaggerUseCase = new (await import('./InitializeSwaggerUseCase.js')).InitializeSwaggerUseCase();
      await initializeSwaggerUseCase.execute(null);
    } catch (error) {
      console.error('Swagger UI 새로고침 실패:', error);
    }
  }

  /**
   * 모달 이벤트 리스너들을 설정합니다
   */
  setupModalEventListeners() {
    // 설정 버튼 클릭
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    // 모달 오버레이 클릭 (배경 클릭시 닫기)
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (event) => {
        if (event.target === event.currentTarget) {
          this.closeModal();
        }
      });
    }

    // 닫기 버튼
    const closeBtn = document.getElementById('closed-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // 저장 버튼
    const saveBtn = document.getElementById('save-modal');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveBookmarks();
      });
    }
  }
}