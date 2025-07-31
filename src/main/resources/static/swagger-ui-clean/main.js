/**
 * 메인 애플리케이션 진입점
 * 클린 아키텍처 기반 커스텀 스웨거 UI 애플리케이션의 진입점입니다.
 */

// 인프라스트럭처 계층
import { SwaggerApiClient } from './infrastructure/api/SwaggerApiClient.js';
import { LocalStorageAdapter } from './infrastructure/storage/LocalStorageAdapter.js';
import { BookmarkRepository } from './infrastructure/storage/BookmarkRepository.js';

// 애플리케이션 계층
import { ApiDataService } from './application/services/ApiDataService.js';
import { SwaggerUIService } from './application/services/SwaggerUIService.js';
import { BookmarkService } from './application/services/BookmarkService.js';
import { SwaggerObserver } from './application/observers/SwaggerObserver.js';

// 프레젠테이션 계층
import { SwaggerController } from './presentation/controllers/SwaggerController.js';
import { BookmarkController } from './presentation/controllers/BookmarkController.js';

// 공유 계층
import { AppConfig } from './shared/config/AppConfig.js';
import { API_ENDPOINTS } from './shared/constants/ApiConstants.js';

/**
 * 애플리케이션 클래스
 * 전체 애플리케이션의 생명주기를 관리합니다.
 */
class SwaggerApplication {
  constructor() {
    this.isInitialized = false;
    this.components = {};
    this.controllers = {};
    
    // 에러 핸들링
    this.setupErrorHandling();
  }

  /**
   * 애플리케이션을 초기화합니다.
   */
  async initialize() {
    try {
      console.log('🚀 Starting Swagger Application initialization...');
      
      if (this.isInitialized) {
        console.warn('Application already initialized');
        return;
      }

      // 1. 의존성 주입 컨테이너 구성
      await this.setupDependencyInjection();
      
      // 2. 설정 초기화
      await this.initializeConfig();
      
      // 3. 컨트롤러 초기화
      await this.initializeControllers();
      
      // 4. 애플리케이션 이벤트 설정
      this.setupApplicationEvents();
      
      this.isInitialized = true;
      console.log('✅ Swagger Application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * 의존성 주입 컨테이너를 설정합니다.
   */
  async setupDependencyInjection() {
    console.log('📦 Setting up dependency injection...');
    
    try {
      // 인프라스트럭처 계층 인스턴스 생성
      const storageAdapter = new LocalStorageAdapter('swagger_ui_');
      const apiClient = new SwaggerApiClient();
      const bookmarkRepository = new BookmarkRepository(storageAdapter);
      
      // 더미 상태 및 메타데이터 저장소 (실제 구현 시 API 클라이언트로 대체)
      const statusRepository = {
        getAll: () => apiClient.getApiStatus()
      };
      
      const metadataRepository = {
        getAll: () => apiClient.getApiMetadata()
      };

      // 애플리케이션 계층 서비스 생성
      const apiDataService = new ApiDataService(apiClient, statusRepository, metadataRepository);
      const swaggerUIService = new SwaggerUIService(storageAdapter);
      const bookmarkService = new BookmarkService(bookmarkRepository);
      const swaggerObserver = new SwaggerObserver();

      // 컴포넌트 등록
      this.components = {
        // 인프라스트럭처
        storageAdapter,
        apiClient,
        bookmarkRepository,
        statusRepository,
        metadataRepository,
        
        // 애플리케이션 서비스
        apiDataService,
        swaggerUIService,
        bookmarkService,
        swaggerObserver
      };

      console.log('✅ Dependency injection setup completed');
    } catch (error) {
      console.error('❌ Failed to setup dependency injection:', error);
      throw error;
    }
  }

  /**
   * 애플리케이션 설정을 초기화합니다.
   */
  async initializeConfig() {
    console.log('⚙️ Initializing application config...');
    
    try {
      const appConfig = new AppConfig(this.components.storageAdapter);
      
      // 환경별 설정 적용
      const environment = this.detectEnvironment();
      appConfig.applyEnvironmentConfig(environment);
      
      // 설정 검증
      const validation = appConfig.validate();
      if (!validation.isValid) {
        console.warn('Config validation issues:', validation.errors);
      }
      
      this.components.appConfig = appConfig;
      
      // 설정 변경 옵저버 등록
      appConfig.addObserver((change) => {
        this.handleConfigChange(change);
      });

      console.log('✅ Application config initialized');
    } catch (error) {
      console.error('❌ Failed to initialize config:', error);
      throw error;
    }
  }

  /**
   * 컨트롤러들을 초기화합니다.
   */
  async initializeControllers() {
    console.log('🎮 Initializing controllers...');
    
    try {
      // 메인 스웨거 컨트롤러
      const swaggerController = new SwaggerController(
        this.components.apiDataService,
        this.components.swaggerUIService,
        this.components.bookmarkService,
        this.components.swaggerObserver
      );

      // 북마크 컨트롤러
      const bookmarkController = new BookmarkController(
        this.components.bookmarkService,
        this.components.apiDataService
      );

      this.controllers = {
        swaggerController,
        bookmarkController
      };

      // 컨트롤러 초기화
      await Promise.all([
        swaggerController.initialize(),
        bookmarkController.initialize()
      ]);

      console.log('✅ Controllers initialized');
    } catch (error) {
      console.error('❌ Failed to initialize controllers:', error);
      throw error;
    }
  }

  /**
   * 애플리케이션 이벤트를 설정합니다.
   */
  setupApplicationEvents() {
    console.log('📡 Setting up application events...');
    
    try {
      // 페이지 언로드 시 정리
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });

      // 페이지 가시성 변경 시 처리
      document.addEventListener('visibilitychange', () => {
        this.handleVisibilityChange();
      });

      // 에러 이벤트 처리
      window.addEventListener('error', (event) => {
        this.handleGlobalError(event.error);
      });

      // 미처리 Promise 거부 처리
      window.addEventListener('unhandledrejection', (event) => {
        this.handleUnhandledRejection(event.reason);
      });

      console.log('✅ Application events setup completed');
    } catch (error) {
      console.error('❌ Failed to setup application events:', error);
    }
  }

  /**
   * 환경을 감지합니다.
   */
  detectEnvironment() {
    // 개발 환경 감지
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return 'development';
    }
    
    // 테스트 환경 감지
    if (location.hostname.includes('test') || location.hostname.includes('staging')) {
      return 'test';
    }
    
    return 'production';
  }

  /**
   * 설정 변경을 처리합니다.
   */
  handleConfigChange(change) {
    console.log('Config changed:', change.path, change.newValue);
    
    try {
      // 테마 변경 처리
      if (change.path === 'ui.theme') {
        this.components.swaggerUIService.setTheme(change.newValue);
      }
      
      // 디버그 모드 변경 처리
      if (change.path === 'developer.enableDebugMode') {
        this.toggleDebugMode(change.newValue);
      }
    } catch (error) {
      console.error('Failed to handle config change:', error);
    }
  }

  /**
   * 페이지 가시성 변경을 처리합니다.
   */
  handleVisibilityChange() {
    try {
      if (document.hidden) {
        console.log('Page became hidden');
        // 백그라운드에서 불필요한 작업 중지
        this.components.swaggerObserver?.stop();
      } else {
        console.log('Page became visible');
        // 페이지가 다시 보일 때 작업 재개
        this.components.swaggerObserver?.start();
      }
    } catch (error) {
      console.error('Failed to handle visibility change:', error);
    }
  }

  /**
   * 전역 에러를 처리합니다.
   */
  handleGlobalError(error) {
    console.error('Global error:', error);
    
    try {
      // 에러 로깅 (실제 구현 시 원격 로깅 서비스 사용)
      this.logError('global', error);
      
      // 사용자에게 친화적인 에러 메시지 표시
      this.showUserFriendlyError('예상치 못한 오류가 발생했습니다.');
    } catch (logError) {
      console.error('Failed to handle global error:', logError);
    }
  }

  /**
   * 처리되지 않은 Promise 거부를 처리합니다.
   */
  handleUnhandledRejection(reason) {
    console.error('Unhandled promise rejection:', reason);
    
    try {
      this.logError('unhandled-rejection', reason);
    } catch (error) {
      console.error('Failed to handle unhandled rejection:', error);
    }
  }

  /**
   * 초기화 에러를 처리합니다.
   */
  handleInitializationError(error) {
    console.error('Initialization error:', error);
    
    try {
      // 사용자에게 초기화 실패 알림
      const errorMessage = '애플리케이션 초기화에 실패했습니다. 페이지를 새로고침해 주세요.';
      this.showUserFriendlyError(errorMessage);
      
      // 페이지 새로고침 버튼 제공
      this.showRefreshButton();
    } catch (displayError) {
      console.error('Failed to handle initialization error:', displayError);
    }
  }

  /**
   * 에러 처리를 설정합니다.
   */
  setupErrorHandling() {
    // 콘솔 에러 오버라이드 (선택적)
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      // 추가 에러 처리 로직
    };
  }

  /**
   * 디버그 모드를 토글합니다.
   */
  toggleDebugMode(enabled) {
    try {
      if (enabled) {
        console.log('🔍 Debug mode enabled');
        // 디버그 정보 표시
        this.showDebugInfo();
      } else {
        console.log('🔍 Debug mode disabled');
        // 디버그 정보 숨김
        this.hideDebugInfo();
      }
    } catch (error) {
      console.error('Failed to toggle debug mode:', error);
    }
  }

  /**
   * 디버그 정보를 표시합니다.
   */
  showDebugInfo() {
    // 개발자 도구에 애플리케이션 상태 출력
    console.group('🔍 Debug Information');
    console.log('Components:', this.components);
    console.log('Controllers:', this.controllers);
    console.log('Config:', this.components.appConfig?.getSummary());
    console.groupEnd();
  }

  /**
   * 디버그 정보를 숨깁니다.
   */
  hideDebugInfo() {
    // 디버그 정보 제거 로직
  }

  /**
   * 에러를 로깅합니다.
   */
  logError(type, error) {
    const errorInfo = {
      type,
      message: error.message || String(error),
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: location.href
    };

    // 로컬 스토리지에 에러 로그 저장 (개발용)
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      logs.push(errorInfo);
      
      // 최대 100개 로그만 유지
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (storageError) {
      console.error('Failed to save error log:', storageError);
    }
  }

  /**
   * 사용자 친화적인 에러 메시지를 표시합니다.
   */
  showUserFriendlyError(message) {
    // 간단한 알림 (실제 구현 시 더 정교한 UI 구성)
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 16px;
      border-radius: 4px;
      z-index: 10000;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * 새로고침 버튼을 표시합니다.
   */
  showRefreshButton() {
    const button = document.createElement('button');
    button.textContent = '페이지 새로고침';
    button.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 12px 24px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10001;
    `;
    
    button.addEventListener('click', () => {
      location.reload();
    });
    
    document.body.appendChild(button);
  }

  /**
   * 애플리케이션 상태를 반환합니다.
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      componentsCount: Object.keys(this.components).length,
      controllersCount: Object.keys(this.controllers).length,
      config: this.components.appConfig?.getSummary() || null,
      controllers: Object.keys(this.controllers).reduce((status, key) => {
        const controller = this.controllers[key];
        status[key] = controller.getStatus ? controller.getStatus() : 'unknown';
        return status;
      }, {})
    };
  }

  /**
   * 애플리케이션을 정리합니다.
   */
  cleanup() {
    try {
      console.log('🧹 Cleaning up application...');
      
      // 컨트롤러 정리
      Object.values(this.controllers).forEach(controller => {
        if (controller.destroy) {
          controller.destroy();
        }
      });
      
      // 옵저버 정리
      if (this.components.swaggerObserver) {
        this.components.swaggerObserver.reset();
      }
      
      // UI 정리
      if (this.components.swaggerUIService) {
        this.components.swaggerUIService.reset();
      }
      
      console.log('✅ Application cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup application:', error);
    }
  }
}

// 애플리케이션 인스턴스 생성 및 초기화
const application = new SwaggerApplication();

// DOM 로드 완료 시 애플리케이션 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    application.initialize().catch(error => {
      console.error('Failed to start application:', error);
    });
  });
} else {
  // DOM이 이미 로드된 경우 즉시 시작
  application.initialize().catch(error => {
    console.error('Failed to start application:', error);
  });
}

// 전역 접근을 위한 window 객체에 애플리케이션 등록 (개발용)
if (typeof window !== 'undefined') {
  window.SwaggerApp = application;
}

// 기본 내보내기
export default application;