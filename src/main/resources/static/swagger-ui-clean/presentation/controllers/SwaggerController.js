/**
 * Swagger 컨트롤러
 * Swagger UI의 주요 기능을 관리하는 프레젠테이션 계층 컨트롤러입니다.
 */
export class SwaggerController {
  constructor(apiDataService, swaggerUIService, bookmarkService, swaggerObserver) {
    this.apiDataService = apiDataService;
    this.swaggerUIService = swaggerUIService;
    this.bookmarkService = bookmarkService;
    this.swaggerObserver = swaggerObserver;
    
    this.isInitialized = false;
    this.currentGroup = null;
    this.eventListeners = new Map();
    
    this.initializeEventHandlers();
  }

  /**
   * 컨트롤러를 초기화합니다.
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        console.warn('Controller already initialized');
        return;
      }

      // 서비스들 초기화
      await this.initializeServices();
      
      // UI 이벤트 리스너 설정
      this.setupUIEventListeners();
      
      // 옵저버 시작
      this.swaggerObserver.start();
      
      this.isInitialized = true;
      console.log('Swagger controller initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Swagger controller:', error);
      throw new Error(`Controller initialization failed: ${error.message}`);
    }
  }

  /**
   * 서비스들을 초기화합니다.
   * 
   * @returns {Promise<void>}
   */
  async initializeServices() {
    try {
      // API 데이터 초기화
      const apiData = await this.apiDataService.initializeApiData();
      
      // 북마크 서비스 초기화
      await this.bookmarkService.initialize();
      
      // 첫 번째 그룹으로 UI 생성
      if (apiData.groupedList && apiData.groupedList.length > 0) {
        await this.loadGroup(apiData.groupedList[0].group);
      } else {
        // 그룹이 없으면 필터링된 UI 생성
        await this.loadFilteredUI();
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * 특정 그룹을 로드합니다.
   * 
   * @param {string} groupName 그룹명
   * @returns {Promise<void>}
   */
  async loadGroup(groupName) {
    try {
      if (!groupName) {
        throw new Error('Group name is required');
      }

      this.currentGroup = groupName;
      
      const ui = await this.swaggerUIService.createUIForGroup(
        groupName,
        (group) => this.apiDataService.getApiSpecByGroup(group)
      );

      this.updateNewApiCounter();
      console.log(`Loaded group: ${groupName}`);
    } catch (error) {
      console.error(`Failed to load group ${groupName}:`, error);
      throw error;
    }
  }

  /**
   * 필터링된 UI를 로드합니다.
   * 
   * @returns {Promise<void>}
   */
  async loadFilteredUI() {
    try {
      const ui = await this.swaggerUIService.createFilteredUI(
        () => this.apiDataService.getFilteredApiSpec()
      );

      this.currentGroup = null;
      this.updateNewApiCounter();
      console.log('Loaded filtered UI');
    } catch (error) {
      console.error('Failed to load filtered UI:', error);
      throw error;
    }
  }

  /**
   * UI를 새로고침합니다.
   * 
   * @returns {Promise<void>}
   */
  async refreshUI() {
    try {
      // API 데이터 새로고침
      await this.apiDataService.refresh();
      
      // 현재 그룹 다시 로드
      if (this.currentGroup) {
        await this.loadGroup(this.currentGroup);
      } else {
        await this.loadFilteredUI();
      }

      console.log('UI refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh UI:', error);
      throw error;
    }
  }

  /**
   * 새로운 API 카운터를 업데이트합니다.
   */
  updateNewApiCounter() {
    try {
      const statistics = this.apiDataService.getStatistics();
      const newApiCount = statistics.newApiCount || 0;
      
      const counterElement = document.getElementById('new-api-counter');
      if (counterElement) {
        counterElement.textContent = `NEW API: ${newApiCount}개`;
      }
    } catch (error) {
      console.error('Failed to update new API counter:', error);
    }
  }

  /**
   * 이벤트 핸들러들을 초기화합니다.
   */
  initializeEventHandlers() {
    // 서비스 이벤트 핸들러
    this.apiDataService.addObserver?.((event, data) => {
      this.handleApiDataEvent(event, data);
    });

    this.swaggerUIService.addObserver((event, data) => {
      this.handleSwaggerUIEvent(event, data);
    });

    this.bookmarkService.addObserver((event, data) => {
      this.handleBookmarkEvent(event, data);
    });

    this.swaggerObserver.addObserver((event, data) => {
      this.handleObserverEvent(event, data);
    });
  }

  /**
   * UI 이벤트 리스너들을 설정합니다.
   */
  setupUIEventListeners() {
    // 새로고침 버튼
    this.addEventListenerSafe('refresh-page-btn', 'click', () => {
      this.refreshUI();
    });

    // LocalStorage 초기화 버튼
    this.addEventListenerSafe('reset-localstorage-btn', 'click', () => {
      this.resetLocalStorage();
    });

    // 쿠키 초기화 버튼
    this.addEventListenerSafe('reset-cookie-btn', 'click', () => {
      this.resetCookies();
    });

    // 사이드바 토글 버튼
    this.addEventListenerSafe('toggle-sidebar-btn', 'click', () => {
      this.toggleSidebar();
    });

    // 설정 버튼
    this.addEventListenerSafe('settings-btn', 'click', () => {
      this.openBookmarkModal();
    });

    // 모달 관련 버튼
    this.addEventListenerSafe('closed-modal', 'click', () => {
      this.closeBookmarkModal();
    });

    this.addEventListenerSafe('save-modal', 'click', () => {
      this.saveBookmarkSettings();
    });

    // 모달 오버레이 클릭
    this.addEventListenerSafe('modal-overlay', 'click', (event) => {
      if (event.target.id === 'modal-overlay') {
        this.closeBookmarkModal();
      }
    });
  }

  /**
   * 안전한 이벤트 리스너 추가
   * 
   * @param {string} elementId 요소 ID
   * @param {string} event 이벤트 타입
   * @param {Function} handler 핸들러 함수
   */
  addEventListenerSafe(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
      
      // 이벤트 리스너 추적
      if (!this.eventListeners.has(elementId)) {
        this.eventListeners.set(elementId, []);
      }
      this.eventListeners.get(elementId).push({ event, handler });
    } else {
      console.warn(`Element ${elementId} not found for event ${event}`);
    }
  }

  /**
   * API 데이터 서비스 이벤트를 처리합니다.
   * 
   * @param {string} event 이벤트명
   * @param {any} data 이벤트 데이터
   */
  handleApiDataEvent(event, data) {
    switch (event) {
      case 'data-updated':
        this.updateNewApiCounter();
        break;
      case 'data-error':
        console.error('API data error:', data);
        break;
    }
  }

  /**
   * Swagger UI 서비스 이벤트를 처리합니다.
   * 
   * @param {string} event 이벤트명
   * @param {any} data 이벤트 데이터
   */
  handleSwaggerUIEvent(event, data) {
    switch (event) {
      case 'ui-created':
        console.log('Swagger UI created');
        break;
      case 'ui-ready':
        console.log('Swagger UI ready');
        break;
      case 'features-initialized':
        console.log('Custom features initialized');
        break;
    }
  }

  /**
   * 북마크 서비스 이벤트를 처리합니다.
   * 
   * @param {string} event 이벤트명
   * @param {any} data 이벤트 데이터
   */
  handleBookmarkEvent(event, data) {
    switch (event) {
      case 'bookmarks-changed':
        this.updateBookmarkDisplay();
        break;
      case 'bookmark-error':
        console.error('Bookmark error:', data);
        break;
    }
  }

  /**
   * 옵저버 이벤트를 처리합니다.
   * 
   * @param {string} event 이벤트명
   * @param {any} data 이벤트 데이터
   */
  handleObserverEvent(event, data) {
    switch (event) {
      case 'api-block-added':
        console.log('API block added and processed');
        break;
      case 'model-section-added':
        console.log('Model section added and processed');
        break;
    }
  }

  /**
   * LocalStorage를 초기화합니다.
   */
  resetLocalStorage() {
    try {
      if (confirm('LocalStorage를 초기화하시겠습니까? 모든 설정이 삭제됩니다.')) {
        localStorage.clear();
        console.log('LocalStorage cleared');
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to reset localStorage:', error);
    }
  }

  /**
   * 쿠키를 초기화합니다.
   */
  resetCookies() {
    try {
      if (confirm('모든 쿠키를 삭제하시겠습니까?')) {
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        console.log('Cookies cleared');
      }
    } catch (error) {
      console.error('Failed to reset cookies:', error);
    }
  }

  /**
   * 사이드바를 토글합니다.
   */
  toggleSidebar() {
    try {
      const sidebar = document.querySelector('.sidebar');
      const swaggerUI = document.getElementById('swagger-ui');
      
      if (sidebar && swaggerUI) {
        sidebar.classList.toggle('collapsed');
        swaggerUI.classList.toggle('sidebar-collapsed');
      }
    } catch (error) {
      console.error('Failed to toggle sidebar:', error);
    }
  }

  /**
   * 북마크 모달을 엽니다.
   */
  openBookmarkModal() {
    try {
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.remove('hidden');
        this.loadBookmarkModalData();
      }
    } catch (error) {
      console.error('Failed to open bookmark modal:', error);
    }
  }

  /**
   * 북마크 모달을 닫습니다.
   */
  closeBookmarkModal() {
    try {
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.add('hidden');
      }
    } catch (error) {
      console.error('Failed to close bookmark modal:', error);
    }
  }

  /**
   * 북마크 설정을 저장합니다.
   */
  async saveBookmarkSettings() {
    try {
      // 북마크 설정 저장 로직
      // TODO: 구현 필요
      this.closeBookmarkModal();
      console.log('Bookmark settings saved');
    } catch (error) {
      console.error('Failed to save bookmark settings:', error);
    }
  }

  /**
   * 북마크 모달 데이터를 로드합니다.
   */
  loadBookmarkModalData() {
    try {
      // 북마크 모달 데이터 로드 로직
      // TODO: 구현 필요
      console.log('Loading bookmark modal data');
    } catch (error) {
      console.error('Failed to load bookmark modal data:', error);
    }
  }

  /**
   * 북마크 표시를 업데이트합니다.
   */
  updateBookmarkDisplay() {
    try {
      // 북마크 표시 업데이트 로직
      // TODO: 구현 필요
      console.log('Updating bookmark display');
    } catch (error) {
      console.error('Failed to update bookmark display:', error);
    }
  }

  /**
   * 컨트롤러 상태를 반환합니다.
   * 
   * @returns {Object} 컨트롤러 상태
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      currentGroup: this.currentGroup,
      uiStatus: this.swaggerUIService.getUIStatus(),
      observerStatus: this.swaggerObserver.getStatus(),
      eventListenersCount: Array.from(this.eventListeners.values())
        .reduce((sum, listeners) => sum + listeners.length, 0)
    };
  }

  /**
   * 컨트롤러를 정리합니다.
   */
  destroy() {
    try {
      // 옵저버 중지
      this.swaggerObserver.stop();
      
      // UI 제거
      this.swaggerUIService.destroyUI();
      
      // 이벤트 리스너 제거
      this.removeAllEventListeners();
      
      // 상태 초기화
      this.isInitialized = false;
      this.currentGroup = null;
      
      console.log('Swagger controller destroyed');
    } catch (error) {
      console.error('Failed to destroy controller:', error);
    }
  }

  /**
   * 모든 이벤트 리스너를 제거합니다.
   */
  removeAllEventListeners() {
    try {
      this.eventListeners.forEach((listeners, elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
          listeners.forEach(({ event, handler }) => {
            element.removeEventListener(event, handler);
          });
        }
      });
      
      this.eventListeners.clear();
    } catch (error) {
      console.error('Failed to remove event listeners:', error);
    }
  }
}