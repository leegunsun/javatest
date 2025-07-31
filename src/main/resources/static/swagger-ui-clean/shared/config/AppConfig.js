import { DEFAULT_CONFIG, STORAGE_KEYS, THEMES } from '../constants/ApiConstants.js';

/**
 * 애플리케이션 설정 관리
 * 애플리케이션의 전역 설정을 관리하는 설정 클래스입니다.
 */
export class AppConfig {
  constructor(storageAdapter = null) {
    this.storageAdapter = storageAdapter;
    this.config = this.loadConfig();
    this.observers = [];
  }

  /**
   * 설정을 로드합니다.
   * 
   * @returns {Object} 로드된 설정
   */
  loadConfig() {
    try {
      const defaultConfig = this.getDefaultConfig();
      
      if (!this.storageAdapter) {
        return defaultConfig;
      }

      const savedConfig = this.storageAdapter.getItem(STORAGE_KEYS.SETTINGS, {});
      return this.mergeConfigs(defaultConfig, savedConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * 기본 설정을 반환합니다.
   * 
   * @returns {Object} 기본 설정
   */
  getDefaultConfig() {
    return {
      // API 설정
      api: {
        baseUrl: '',
        timeout: DEFAULT_CONFIG.REQUEST_TIMEOUT,
        maxRetries: DEFAULT_CONFIG.MAX_RETRIES,
        retryDelay: DEFAULT_CONFIG.RETRY_DELAY,
        cacheExpiryTime: DEFAULT_CONFIG.CACHE_EXPIRY_TIME
      },

      // UI 설정
      ui: {
        theme: THEMES.LIGHT,
        language: 'ko',
        sidebarCollapsed: false,
        showNewApiCounter: true,
        enableAnimations: true,
        animationDuration: 300
      },

      // Swagger UI 설정
      swaggerUI: {
        ...DEFAULT_CONFIG.SWAGGER_UI,
        deepLinking: true,
        displayOperationId: false,
        displayRequestDuration: true,
        maxDisplayedTags: 20,
        showExtensions: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        validatorUrl: null
      },

      // 북마크 설정
      bookmarks: {
        maxBookmarks: 100,
        autoSave: true,
        showGroupIcons: true,
        sortBy: 'name', // 'name', 'date', 'tag'
        sortOrder: 'asc' // 'asc', 'desc'
      },

      // 개발자 설정
      developer: {
        enableDebugMode: false,
        showPerformanceMetrics: false,
        enableConsoleLogging: true,
        logLevel: 'info' // 'debug', 'info', 'warn', 'error'
      },

      // 접근성 설정
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReaderSupport: true,
        keyboardNavigation: true
      },

      // 성능 설정
      performance: {
        enableVirtualScrolling: false,
        lazyLoadImages: true,
        prefetchData: true,
        debounceDelay: 300
      }
    };
  }

  /**
   * 설정들을 병합합니다.
   * 
   * @param {Object} defaultConfig 기본 설정
   * @param {Object} userConfig 사용자 설정
   * @returns {Object} 병합된 설정
   */
  mergeConfigs(defaultConfig, userConfig) {
    const merged = { ...defaultConfig };

    Object.keys(userConfig).forEach(key => {
      if (typeof userConfig[key] === 'object' && userConfig[key] !== null && !Array.isArray(userConfig[key])) {
        merged[key] = { ...defaultConfig[key], ...userConfig[key] };
      } else {
        merged[key] = userConfig[key];
      }
    });

    return merged;
  }

  /**
   * 설정 값을 가져옵니다.
   * 
   * @param {string} path 설정 경로 (예: 'ui.theme')
   * @param {any} defaultValue 기본값
   * @returns {any} 설정 값
   */
  get(path, defaultValue = null) {
    try {
      const keys = path.split('.');
      let current = this.config;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return defaultValue;
        }
      }

      return current;
    } catch (error) {
      console.error(`Failed to get config value for path: ${path}`, error);
      return defaultValue;
    }
  }

  /**
   * 설정 값을 설정합니다.
   * 
   * @param {string} path 설정 경로 (예: 'ui.theme')
   * @param {any} value 설정할 값
   * @returns {boolean} 설정 성공 여부
   */
  set(path, value) {
    try {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let current = this.config;

      // 중간 경로 생성
      for (const key of keys) {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }

      // 값 설정
      const oldValue = current[lastKey];
      current[lastKey] = value;

      // 변경 알림
      this.notifyObservers(path, value, oldValue);

      // 저장
      this.saveConfig();

      return true;
    } catch (error) {
      console.error(`Failed to set config value for path: ${path}`, error);
      return false;
    }
  }

  /**
   * 여러 설정을 한번에 업데이트합니다.
   * 
   * @param {Object} updates 업데이트할 설정들
   * @returns {boolean} 업데이트 성공 여부
   */
  update(updates) {
    try {
      const changes = [];

      Object.entries(updates).forEach(([path, value]) => {
        const oldValue = this.get(path);
        if (this.set(path, value)) {
          changes.push({ path, value, oldValue });
        }
      });

      if (changes.length > 0) {
        this.notifyObservers('batch-update', { changes });
      }

      return true;
    } catch (error) {
      console.error('Failed to update config:', error);
      return false;
    }
  }

  /**
   * 설정을 저장합니다.
   * 
   * @returns {boolean} 저장 성공 여부
   */
  saveConfig() {
    try {
      if (!this.storageAdapter) {
        console.warn('No storage adapter available for saving config');
        return false;
      }

      return this.storageAdapter.setItem(STORAGE_KEYS.SETTINGS, this.config);
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  /**
   * 설정을 초기화합니다.
   * 
   * @returns {boolean} 초기화 성공 여부
   */
  reset() {
    try {
      this.config = this.getDefaultConfig();
      this.saveConfig();
      this.notifyObservers('reset', this.config);
      return true;
    } catch (error) {
      console.error('Failed to reset config:', error);
      return false;
    }
  }

  /**
   * 특정 섹션의 설정을 초기화합니다.
   * 
   * @param {string} section 섹션명
   * @returns {boolean} 초기화 성공 여부
   */
  resetSection(section) {
    try {
      const defaultConfig = this.getDefaultConfig();
      
      if (section in defaultConfig) {
        this.config[section] = defaultConfig[section];
        this.saveConfig();
        this.notifyObservers(`reset-${section}`, this.config[section]);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to reset config section: ${section}`, error);
      return false;
    }
  }

  /**
   * 설정을 내보냅니다.
   * 
   * @param {boolean} includeDefaults 기본값 포함 여부
   * @returns {string} 내보낸 설정 (JSON 문자열)
   */
  export(includeDefaults = false) {
    try {
      let configToExport = this.config;

      if (!includeDefaults) {
        // 기본값과 다른 설정만 내보내기
        const defaultConfig = this.getDefaultConfig();
        configToExport = this.getDifferentValues(this.config, defaultConfig);
      }

      return JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        config: configToExport
      }, null, 2);
    } catch (error) {
      console.error('Failed to export config:', error);
      return null;
    }
  }

  /**
   * 설정을 가져옵니다.
   * 
   * @param {string} importData 가져올 설정 (JSON 문자열)
   * @returns {boolean} 가져오기 성공 여부
   */
  import(importData) {
    try {
      const data = JSON.parse(importData);
      
      if (!data.config || typeof data.config !== 'object') {
        throw new Error('Invalid import data format');
      }

      // 가져온 설정을 현재 설정과 병합
      this.config = this.mergeConfigs(this.config, data.config);
      this.saveConfig();
      
      this.notifyObservers('import', { data, config: this.config });
      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }

  /**
   * 기본값과 다른 값들만 추출합니다.
   * 
   * @param {Object} current 현재 설정
   * @param {Object} defaults 기본 설정
   * @returns {Object} 다른 값들
   */
  getDifferentValues(current, defaults) {
    const different = {};

    Object.keys(current).forEach(key => {
      if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key])) {
        const nestedDifferent = this.getDifferentValues(current[key], defaults[key] || {});
        if (Object.keys(nestedDifferent).length > 0) {
          different[key] = nestedDifferent;
        }
      } else if (current[key] !== defaults[key]) {
        different[key] = current[key];
      }
    });

    return different;
  }

  /**
   * 설정 유효성을 검증합니다.
   * 
   * @returns {Object} 검증 결과
   */
  validate() {
    const errors = [];
    const warnings = [];

    try {
      // API 설정 검증
      const apiTimeout = this.get('api.timeout');
      if (apiTimeout < 1000 || apiTimeout > 60000) {
        warnings.push('API timeout should be between 1 and 60 seconds');
      }

      // UI 설정 검증
      const theme = this.get('ui.theme');
      if (!Object.values(THEMES).includes(theme)) {
        errors.push(`Invalid theme: ${theme}`);
      }

      // 북마크 설정 검증
      const maxBookmarks = this.get('bookmarks.maxBookmarks');
      if (maxBookmarks < 1 || maxBookmarks > 1000) {
        warnings.push('Max bookmarks should be between 1 and 1000');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Failed to validate config:', error);
      return {
        isValid: false,
        errors: ['Configuration validation failed'],
        warnings: []
      };
    }
  }

  /**
   * 환경별 설정을 적용합니다.
   * 
   * @param {string} environment 환경 ('development', 'production', 'test')
   */
  applyEnvironmentConfig(environment) {
    try {
      const envConfigs = {
        development: {
          'developer.enableDebugMode': true,
          'developer.showPerformanceMetrics': true,
          'developer.logLevel': 'debug'
        },
        production: {
          'developer.enableDebugMode': false,
          'developer.showPerformanceMetrics': false,
          'developer.logLevel': 'error'
        },
        test: {
          'developer.enableDebugMode': true,
          'developer.enableConsoleLogging': false,
          'developer.logLevel': 'warn'
        }
      };

      const envConfig = envConfigs[environment];
      if (envConfig) {
        this.update(envConfig);
        console.log(`Applied ${environment} environment config`);
      }
    } catch (error) {
      console.error('Failed to apply environment config:', error);
    }
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
   * 옵저버들에게 변경 사항을 알립니다.
   * 
   * @param {string} path 변경된 경로
   * @param {any} newValue 새로운 값
   * @param {any} oldValue 이전 값
   */
  notifyObservers(path, newValue, oldValue = null) {
    this.observers.forEach(observer => {
      try {
        observer({ path, newValue, oldValue, config: this.config });
      } catch (error) {
        console.error('Observer error:', error);
      }
    });
  }

  /**
   * 설정 요약 정보를 반환합니다.
   * 
   * @returns {Object} 설정 요약
   */
  getSummary() {
    try {
      const validation = this.validate();
      
      return {
        theme: this.get('ui.theme'),
        language: this.get('ui.language'),
        debugMode: this.get('developer.enableDebugMode'),
        maxBookmarks: this.get('bookmarks.maxBookmarks'),
        apiTimeout: this.get('api.timeout'),
        cacheExpiry: this.get('api.cacheExpiryTime'),
        validation: validation,
        lastModified: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get config summary:', error);
      return {};
    }
  }
}