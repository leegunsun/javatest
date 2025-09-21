import { FilterApiSpecUseCase } from '../../domain/usecases/FilterApiSpec.js';
import { SwaggerSpec } from '../../domain/entities/SwaggerSpec.js';

/**
 * Swagger UI 서비스
 * Swagger UI의 생성, 관리, 설정을 담당하는 애플리케이션 계층 서비스입니다.
 */
export class SwaggerUIService {
  constructor(storageAdapter) {
    this.filterApiSpecUseCase = new FilterApiSpecUseCase(storageAdapter);
    this.currentUI = null;
    this.currentSpec = null;
    this.uiConfig = this.getDefaultConfig();
    this.observers = [];
  }

  /**
   * 기본 Swagger UI 설정을 반환합니다.
   * 
   * @returns {Object} 기본 설정
   */
  getDefaultConfig() {
    return {
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      defaultModelsExpandDepth: 0,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    };
  }

  /**
   * Swagger UI를 생성합니다.
   * 
   * @param {Object|SwaggerSpec} spec API 스펙
   * @param {Object} customConfig 사용자 정의 설정
   * @returns {Promise<Object>} Swagger UI 인스턴스
   */
  async createSwaggerUI(spec, customConfig = {}) {
    try {
      // 스펙 유효성 검증
      const swaggerSpec = this.normalizeSpec(spec);
      if (!swaggerSpec.isValid()) {
        throw new Error('Invalid Swagger specification provided');
      }

      // 설정 병합
      const config = {
        ...this.uiConfig,
        ...customConfig,
        spec: swaggerSpec.toJSON(),
        onComplete: () => {
          this.onUIComplete();
          if (customConfig.onComplete) {
            customConfig.onComplete();
          }
        }
      };

      // UI 생성
      this.currentUI = SwaggerUIBundle(config);
      this.currentSpec = swaggerSpec;

      this.notifyObservers('ui-created', { ui: this.currentUI, spec: swaggerSpec });

      return this.currentUI;
    } catch (error) {
      console.error('Failed to create Swagger UI:', error);
      throw new Error(`Swagger UI creation failed: ${error.message}`);
    }
  }

  /**
   * 그룹 기반 Swagger UI를 생성합니다.
   * 
   * @param {string} groupName 그룹명
   * @param {Function} apiSpecLoader API 스펙 로더 함수
   * @returns {Promise<Object>} Swagger UI 인스턴스
   */
  async createUIForGroup(groupName, apiSpecLoader) {
    try {
      if (!groupName) {
        throw new Error('Group name is required');
      }

      if (typeof apiSpecLoader !== 'function') {
        throw new Error('API spec loader must be a function');
      }

      const rawSpec = await apiSpecLoader(groupName);
      const swaggerSpec = new SwaggerSpec(rawSpec);

      return this.createSwaggerUI(swaggerSpec);
    } catch (error) {
      console.error(`Failed to create UI for group ${groupName}:`, error);
      throw error;
    }
  }

  /**
   * 필터링된 Swagger UI를 생성합니다.
   * 
   * @param {Function} filteredSpecLoader 필터링된 스펙 로더 함수
   * @returns {Promise<Object>} Swagger UI 인스턴스
   */
  async createFilteredUI(filteredSpecLoader) {
    try {
      if (typeof filteredSpecLoader !== 'function') {
        throw new Error('Filtered spec loader must be a function');
      }

      const rawSpec = await filteredSpecLoader();
      const originalSpec = new SwaggerSpec(rawSpec);
      const filteredSpec = this.filterApiSpecUseCase.execute(originalSpec);

      return this.createSwaggerUI(filteredSpec);
    } catch (error) {
      console.error('Failed to create filtered UI:', error);
      throw error;
    }
  }

  /**
   * 현재 UI를 업데이트합니다.
   * 
   * @param {Object|SwaggerSpec} newSpec 새로운 스펙
   * @returns {Promise<Object>} 업데이트된 UI 인스턴스
   */
  async updateUI(newSpec) {
    try {
      if (!this.currentUI) {
        return this.createSwaggerUI(newSpec);
      }

      const swaggerSpec = this.normalizeSpec(newSpec);
      this.currentSpec = swaggerSpec;

      // UI 재생성 (Swagger UI는 동적 업데이트가 제한적이므로)
      return this.createSwaggerUI(swaggerSpec);
    } catch (error) {
      console.error('Failed to update UI:', error);
      throw error;
    }
  }

  /**
   * UI 완료 시 호출되는 콜백입니다.
   */
  onUIComplete() {
    try {
      setTimeout(() => {
        this.initializeCustomFeatures();
        this.notifyObservers('ui-ready', { ui: this.currentUI });
      }, 1000);
    } catch (error) {
      console.error('Failed to complete UI initialization:', error);
    }
  }

  /**
   * 커스텀 기능들을 초기화합니다.
   */
  initializeCustomFeatures() {
    try {
      this.initializeDropdownPersistence();
      this.notifyObservers('features-initialized');
    } catch (error) {
      console.error('Failed to initialize custom features:', error);
    }
  }

  /**
   * 서버 드롭다운 상태를 로컬 스토리지에 저장합니다.
   */
  initializeDropdownPersistence() {
    try {
      const serverDropdown = document.getElementById("servers");
      if (!serverDropdown) {
        console.warn('Server dropdown not found');
        return;
      }

      // 저장된 값 복원
      const savedUrl = this.filterApiSpecUseCase.storageAdapter.getItem("server_url");
      if (savedUrl) {
        serverDropdown.value = savedUrl;
        serverDropdown.dispatchEvent(new Event("change", { bubbles: true }));
      }

      // 변경 시 저장
      serverDropdown.addEventListener("change", () => {
        this.filterApiSpecUseCase.storageAdapter.setItem("server_url", serverDropdown.value);
      });
    } catch (error) {
      console.error('Failed to initialize dropdown persistence:', error);
    }
  }

  /**
   * 스펙을 정규화합니다.
   * 
   * @param {Object|SwaggerSpec} spec 스펙
   * @returns {SwaggerSpec} 정규화된 스펙
   */
  normalizeSpec(spec) {
    if (spec instanceof SwaggerSpec) {
      return spec;
    }

    if (typeof spec === 'object' && spec !== null) {
      return new SwaggerSpec(spec);
    }

    throw new Error('Invalid spec format');
  }

  /**
   * 현재 UI 인스턴스를 반환합니다.
   * 
   * @returns {Object|null} 현재 UI 인스턴스
   */
  getCurrentUI() {
    return this.currentUI;
  }

  /**
   * 현재 스펙을 반환합니다.
   * 
   * @returns {SwaggerSpec|null} 현재 스펙
   */
  getCurrentSpec() {
    return this.currentSpec;
  }

  /**
   * UI 설정을 업데이트합니다.
   * 
   * @param {Object} newConfig 새로운 설정
   */
  updateConfig(newConfig) {
    this.uiConfig = {
      ...this.uiConfig,
      ...newConfig
    };
  }

  /**
   * UI를 제거합니다.
   */
  destroyUI() {
    try {
      if (this.currentUI) {
        // Swagger UI 인스턴스 정리
        const container = document.querySelector(this.uiConfig.dom_id);
        if (container) {
          container.innerHTML = '';
        }

        this.currentUI = null;
        this.currentSpec = null;

        this.notifyObservers('ui-destroyed');
      }
    } catch (error) {
      console.error('Failed to destroy UI:', error);
    }
  }

  /**
   * UI 상태를 확인합니다.
   * 
   * @returns {Object} UI 상태
   */
  getUIStatus() {
    return {
      isActive: !!this.currentUI,
      hasSpec: !!this.currentSpec,
      specValid: this.currentSpec ? this.currentSpec.isValid() : false,
      pathCount: this.currentSpec ? this.currentSpec.getPathCount() : 0,
      operationCount: this.currentSpec ? this.currentSpec.getOperationCount() : 0
    };
  }

  /**
   * 옵저버를 추가합니다.
   * 
   * @param {Function} observer 옵저버 함수
   */
  addObserver(observer) {
    if (typeof observer === 'function') {
      this.observers.push(observer);
    }
  }

  /**
   * 옵저버를 제거합니다.
   * 
   * @param {Function} observer 제거할 옵저버 함수
   */
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * 옵저버들에게 이벤트를 알립니다.
   * 
   * @param {string} event 이벤트명
   * @param {any} data 이벤트 데이터
   */
  notifyObservers(event, data = null) {
    this.observers.forEach(observer => {
      try {
        observer(event, data);
      } catch (error) {
        console.error('Observer error:', error);
      }
    });
  }

  /**
   * UI 테마를 설정합니다.
   * 
   * @param {string} theme 테마 ('light' | 'dark')
   */
  setTheme(theme) {
    try {
      const container = document.querySelector(this.uiConfig.dom_id);
      if (container) {
        container.className = container.className.replace(/theme-\w+/g, '');
        container.classList.add(`theme-${theme}`);
        
        this.notifyObservers('theme-changed', { theme });
      }
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  }

  /**
   * 커스텀 CSS를 적용합니다.
   * 
   * @param {string} css CSS 문자열
   */
  applyCustomCSS(css) {
    try {
      const styleId = 'swagger-ui-custom-styles';
      let styleElement = document.getElementById(styleId);

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = css;
      this.notifyObservers('css-applied', { css });
    } catch (error) {
      console.error('Failed to apply custom CSS:', error);
    }
  }

  /**
   * 서비스를 초기화합니다.
   */
  reset() {
    this.destroyUI();
    this.observers = [];
    this.uiConfig = this.getDefaultConfig();
  }
}