/**
 * 메인 애플리케이션 진입점
 * 클린 아키텍처로 리팩토링된 Swagger UI 커스터마이제이션
 */

import { container } from './DependencyContainer.js';
import { API_ENDPOINTS } from './shared/constants/ApiConstants.js';
import { DomUtils } from './shared/utils/DomUtils.js';

/**
 * 애플리케이션 클래스
 * 전체 애플리케이션의 생명주기를 관리합니다
 */
class SwaggerUIApplication {
  constructor() {
    this.isInitialized = false;
    this.container = container;
    
    // Use Cases
    this.initializeSwaggerUseCase = null;
    this.manageSidebarUseCase = null;
    this.manageBookmarkModalUseCase = null;
    this.highlightApiUseCase = null;
  }

  /**
   * 애플리케이션을 초기화합니다
   */
  async initialize() {
    try {
      console.log('🚀 Swagger UI 애플리케이션 초기화 시작...');
      
      // 의존성 컨테이너 상태 확인
      this.container.logStatus();
      
      // Use Cases 인스턴스 가져오기
      this.initializeUseCases();
      
      // 이벤트 리스너 설정
      this.setupEventListeners();
      
      // API 데이터 로드 및 초기 렌더링
      await this.loadInitialData();
      
      this.isInitialized = true;
      console.log('✅ Swagger UI 애플리케이션 초기화 완료');
      
    } catch (error) {
      console.error('❌ 애플리케이션 초기화 실패:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Use Cases 인스턴스들을 초기화합니다
   */
  initializeUseCase() {
    try {
      this.initializeSwaggerUseCase = this.container.get('InitializeSwaggerUseCase');
      this.manageSidebarUseCase = this.container.get('ManageSidebarUseCase');
      this.manageBookmarkModalUseCase = this.container.get('ManageBookmarkModalUseCase');
      this.highlightApiUseCase = this.container.get('HighlightApiUseCase');
    } catch (error) {
      console.error('Use Cases 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 전역 이벤트 리스너들을 설정합니다
   */
  setupEventListeners() {
    try {
      // 페이지 새로고침 버튼
      this.setupRefreshButton();
      
      // 로컬스토리지 초기화 버튼
      this.setupLocalStorageResetButton();
      
      // 쿠키 초기화 버튼
      this.setupCookieResetButton();
      
      // 모달 관련 이벤트
      this.setupModalEventListeners();
      
      // 페이지 언로드 이벤트
      this.setupUnloadHandler();
      
    } catch (error) {
      console.error('이벤트 리스너 설정 실패:', error);
    }
  }

  /**
   * 새로고침 버튼 이벤트를 설정합니다
   */
  setupRefreshButton() {
    const refreshBtn = DomUtils.findElement('#refresh-page-btn');
    if (refreshBtn) {
      DomUtils.addEventListener(refreshBtn, 'click', () => {
        window.location.reload();
      });
    }
  }

  /**
   * 로컬스토리지 초기화 버튼 이벤트를 설정합니다
   */
  setupLocalStorageResetButton() {
    const resetBtn = DomUtils.findElement('#reset-localstorage-btn');
    if (resetBtn) {
      DomUtils.addEventListener(resetBtn, 'click', () => {
        try {
          const storageRepository = this.container.get('StorageRepository');
          storageRepository.clear();
          alert('LocalStorage가 초기화되었습니다.');
        } catch (error) {
          console.error('로컬스토리지 초기화 실패:', error);
          alert('로컬스토리지 초기화에 실패했습니다.');
        }
      });
    }
  }

  /**
   * 쿠키 초기화 버튼 이벤트를 설정합니다
   */
  setupCookieResetButton() {
    const resetBtn = DomUtils.findElement('#reset-cookie-btn');
    if (resetBtn) {
      DomUtils.addEventListener(resetBtn, 'click', () => {
        try {
          const storageRepository = this.container.get('StorageRepository');
          storageRepository.clearCookies();
          alert('쿠키가 초기화되었습니다.');
        } catch (error) {
          console.error('쿠키 초기화 실패:', error);
          alert('쿠키 초기화에 실패했습니다.');
        }
      });
    }
  }

  /**
   * 모달 관련 이벤트 리스너들을 설정합니다
   */
  setupModalEventListeners() {
    if (this.manageBookmarkModalUseCase) {
      this.manageBookmarkModalUseCase.setupModalEventListeners();
    }
  }

  /**
   * 페이지 언로드 핸들러를 설정합니다
   */
  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * 초기 데이터를 로드하고 UI를 렌더링합니다
   */
  async loadInitialData() {
    try {
      // API 상태 데이터 로드
      const apiStatusRepository = this.container.get('ApiStatusRepository');
      const { statusMap, createdMap, groupedList } = await apiStatusRepository.fetchAllData();

      // 사이드바 초기화
      await this.initializeSidebar(groupedList);

      // 첫 번째 그룹으로 Swagger UI 초기화 (그룹이 있는 경우)
      const initialGroup = groupedList.length > 0 ? groupedList[0].group : null;
      await this.initializeSwaggerUseCase.execute(initialGroup);

      // 하이라이트 적용
      setTimeout(() => {
        this.highlightApiUseCase.highlightAll();
      }, 2000);

    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
      this.showErrorMessage('초기 데이터를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 사이드바를 초기화합니다
   * @param {Array} groupedList 
   */
  async initializeSidebar(groupedList) {
    try {
      const sidebarContainer = DomUtils.findElement('#api-tree');
      
      if (!sidebarContainer) {
        console.warn('사이드바 컨테이너를 찾을 수 없습니다');
        return;
      }

      await this.manageSidebarUseCase.initializeSidebar(groupedList, sidebarContainer);
      
      // 사이드바 상태 복원
      await this.manageSidebarUseCase.restoreSidebarState();
      
    } catch (error) {
      console.error('사이드바 초기화 실패:', error);
    }
  }

  /**
   * 초기화 오류를 처리합니다
   * @param {Error} error 
   */
  handleInitializationError(error) {
    const errorContainer = DomUtils.findElement('#swagger-ui');
    if (errorContainer) {
      DomUtils.setContent(errorContainer, `
        <div class="initialization-error">
          <h2>⚠️ 초기화 오류</h2>
          <p>Swagger UI를 초기화하는 중 오류가 발생했습니다.</p>
          <details>
            <summary>오류 세부사항</summary>
            <pre>${error.stack || error.message}</pre>
          </details>
          <button onclick="location.reload()">페이지 새로고침</button>
        </div>
      `, true);
    }
  }

  /**
   * 오류 메시지를 표시합니다
   * @param {string} message 
   */
  showErrorMessage(message) {
    console.error(message);
    
    // 사용자에게 알림 표시
    const notification = DomUtils.createElement('div', {
      className: 'error-notification',
      style: 'position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 12px; border-radius: 4px; z-index: 10000;'
    }, message);

    document.body.appendChild(notification);

    // 5초 후 자동 제거
    setTimeout(() => {
      DomUtils.removeElement(notification);
    }, 5000);
  }

  /**
   * 성공 메시지를 표시합니다
   * @param {string} message 
   */
  showSuccessMessage(message) {
    console.log(message);
    
    const notification = DomUtils.createElement('div', {
      className: 'success-notification',
      style: 'position: fixed; top: 20px; right: 20px; background: #4caf50; color: white; padding: 12px; border-radius: 4px; z-index: 10000;'
    }, message);

    document.body.appendChild(notification);

    setTimeout(() => {
      DomUtils.removeElement(notification);
    }, 3000);
  }

  /**
   * 애플리케이션 정리 작업을 수행합니다
   */
  cleanup() {
    try {
      console.log('🧹 애플리케이션 정리 작업 수행 중...');
      
      // 리소스 정리
      if (window.ui) {
        // Swagger UI 인스턴스 정리
        window.ui = null;
      }
      
      // 이벤트 리스너 정리는 브라우저가 자동으로 처리
      
      console.log('✅ 정리 작업 완료');
    } catch (error) {
      console.error('정리 작업 실패:', error);
    }
  }

  /**
   * 애플리케이션 상태를 반환합니다
   * @returns {Object}
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasSwaggerUI: !!window.ui,
      dependencies: this.container.getRegisteredNames(),
      timestamp: new Date().toISOString()
    };
  }
}

// 전역 애플리케이션 인스턴스
const app = new SwaggerUIApplication();

// 페이지 로드 완료 시 애플리케이션 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.initialize();
  });
} else {
  app.initialize();
}

// 개발 목적으로 전역에서 접근 가능하도록 설정
window.swaggerApp = app;

export default app;