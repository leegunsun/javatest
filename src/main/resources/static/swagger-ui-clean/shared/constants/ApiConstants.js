/**
 * API 상수 정의
 * 애플리케이션 전반에서 사용되는 API 관련 상수들을 정의합니다.
 */

// API 엔드포인트
export const API_ENDPOINTS = {
  API_STATUS: '/swagger-status/api-status.json',
  API_METADATA: '/swagger-status/api-meta.json',
  GROUPED_LIST: '/swagger-status/grouped-openapi-list',
  API_DOCS: '/v3/api-docs',
  FILTERED_API: '/v3/api-docs/filtered-api'
};

// HTTP 메서드
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
};

// API 상태 타입
export const API_STATUS_TYPES = {
  COMPLETED: '✅',        // 작업완료
  NOT_WORKING: '⛔',      // 작업안함
  TEST_SUCCESS: '🎉',     // 테스트성공
  TEST_FAILED: '❌',      // 테스트실패
  TEST_COMPLETED: '🟩',   // 테스트완료
  TESTING: '🪪',          // 테스트중
  WORKING: '🔧',          // 작업중
  UPDATED: '⬆️'           // 업데이트
};

// API 상태 이름
export const API_STATUS_NAMES = {
  [API_STATUS_TYPES.COMPLETED]: '작업완료',
  [API_STATUS_TYPES.NOT_WORKING]: '작업안함',
  [API_STATUS_TYPES.TEST_SUCCESS]: '테스트성공',
  [API_STATUS_TYPES.TEST_FAILED]: '테스트실패',
  [API_STATUS_TYPES.TEST_COMPLETED]: '테스트완료',
  [API_STATUS_TYPES.TESTING]: '테스트중',
  [API_STATUS_TYPES.WORKING]: '작업중',
  [API_STATUS_TYPES.UPDATED]: '업데이트'
};

// CSS 클래스명
export const CSS_CLASSES = {
  STATUS: {
    COMPLETED: 'status-작업완료',
    NOT_WORKING: 'status-작업안함',
    TEST_SUCCESS: 'status-테스트성공',
    TEST_FAILED: 'status-테스트실패',
    TEST_COMPLETED: 'status-테스트완료',
    TESTING: 'status-테스트중',
    WORKING: 'status-작업중',
    UPDATED: 'status-업데이트'
  },
  BADGE: {
    COMPLETED: 'badge-작업완료',
    NOT_WORKING: 'badge-작업안함',
    TEST_SUCCESS: 'badge-테스트성공',
    TEST_FAILED: 'badge-테스트실패',
    TEST_COMPLETED: 'badge-테스트완료',
    TESTING: 'badge-테스트중',
    WORKING: 'badge-작업중',
    UPDATED: 'badge-업데이트'
  },
  MODAL: {
    OVERLAY: 'modal-overlay',
    MODAL: 'modal',
    HIDDEN: 'hidden'
  },
  SIDEBAR: {
    SIDEBAR: 'sidebar',
    COLLAPSED: 'collapsed',
    CONTENT: 'sidebar-content'
  },
  BOOKMARK: {
    ROOT_GROUP: 'custom_side_bar-root-group',
    SUBCATEGORY: 'custom_side_bar-subcategory',
    DELETE_BUTTON: 'custom_sub-delete-button'
  }
};

// DOM 선택자
export const DOM_SELECTORS = {
  // 메인 컨테이너
  SWAGGER_UI: '#swagger-ui',
  SIDEBAR: '.sidebar',
  MAIN_CONTAINER: '.main-container',
  
  // 버튼들
  REFRESH_BUTTON: '#refresh-page-btn',
  RESET_STORAGE_BUTTON: '#reset-localstorage-btn',
  RESET_COOKIE_BUTTON: '#reset-cookie-btn',
  TOGGLE_SIDEBAR_BUTTON: '#toggle-sidebar-btn',
  SETTINGS_BUTTON: '#settings-btn',
  
  // 모달
  MODAL_OVERLAY: '#modal-overlay',
  MODAL: '#modal',
  CLOSE_MODAL_BUTTON: '#closed-modal',
  SAVE_MODAL_BUTTON: '#save-modal',
  
  // 모달 내용
  CATEGORY_LIST: '#category-list',
  SUBCATEGORY_LIST: '#subcategory-list',
  SELECTED_SUBCATEGORIES: '#selected-subcategories',
  
  // 카운터 및 트리
  NEW_API_COUNTER: '#new-api-counter',
  API_TREE: '#api-tree',
  CUSTOM_API_TREE: '#custom-api-tree',
  
  // 서버 드롭다운
  SERVERS_DROPDOWN: '#servers',
  
  // Swagger UI 요소
  OPBLOCK: '.opblock',
  OPBLOCK_SUMMARY: '.opblock-summary',
  OPBLOCK_DESCRIPTION: '.opblock-summary-description',
  MODELS: '.models',
  MODEL_CONTAINER: '.model-container'
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  BOOKMARKS: 'bookmarks',
  USED_PATH: 'usedPath',
  SERVER_URL: 'server_url',
  SIDEBAR_STATE: 'sidebar_state',
  THEME: 'theme',
  SETTINGS: 'settings'
};

// 이벤트 타입
export const EVENT_TYPES = {
  // 북마크 이벤트
  BOOKMARK_ADDED: 'bookmark-added',
  BOOKMARK_REMOVED: 'bookmark-removed',
  BOOKMARKS_CHANGED: 'bookmarks-changed',
  BOOKMARKS_CLEARED: 'bookmarks-cleared',
  
  // UI 이벤트
  UI_CREATED: 'ui-created',
  UI_READY: 'ui-ready',
  UI_DESTROYED: 'ui-destroyed',
  
  // API 데이터 이벤트
  DATA_LOADED: 'data-loaded',
  DATA_ERROR: 'data-error',
  DATA_UPDATED: 'data-updated',
  
  // 옵저버 이벤트
  ELEMENT_ADDED: 'element-added',
  ELEMENT_REMOVED: 'element-removed',
  API_BLOCK_ADDED: 'api-block-added',
  MODEL_SECTION_ADDED: 'model-section-added'
};

// 설정 기본값
export const DEFAULT_CONFIG = {
  CACHE_EXPIRY_TIME: 5 * 60 * 1000, // 5분
  REQUEST_TIMEOUT: 10000, // 10초
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1초
  
  SWAGGER_UI: {
    dom_id: "#swagger-ui",
    presets: ["SwaggerUIBundle.presets.apis"],
    layout: "BaseLayout",
    defaultModelsExpandDepth: 0,
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  INVALID_DATA: '유효하지 않은 데이터입니다.',
  INITIALIZATION_FAILED: '초기화에 실패했습니다.',
  BOOKMARK_SAVE_FAILED: '북마크 저장에 실패했습니다.',
  API_LOAD_FAILED: 'API 로드에 실패했습니다.',
  INVALID_GROUP: '유효하지 않은 그룹입니다.',
  STORAGE_ERROR: '저장소 오류가 발생했습니다.'
};

// 성공 메시지
export const SUCCESS_MESSAGES = {
  BOOKMARK_ADDED: '북마크가 추가되었습니다.',
  BOOKMARK_REMOVED: '북마크가 제거되었습니다.',
  BOOKMARKS_CLEARED: '모든 북마크가 제거되었습니다.',
  DATA_REFRESHED: '데이터가 새로고침되었습니다.',
  SETTINGS_SAVED: '설정이 저장되었습니다.'
};

// 정규식 패턴
export const REGEX_PATTERNS = {
  CONTROLLER_NAME: /^[a-zA-Z0-9_.]+Controller$/,
  METHOD_NAME: /^[a-zA-Z][a-zA-Z0-9_]*$/,
  API_PATH: /^\/api\/[a-zA-Z0-9_\-\/]+$/,
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// 테마 설정
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// 애니메이션 지속 시간
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
};

// 디버그 설정
export const DEBUG = {
  ENABLED: process.env.NODE_ENV === 'development',
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  PERFORMANCE_MONITORING: true
};

// 브라우저 호환성
export const BROWSER_SUPPORT = {
  MIN_CHROME_VERSION: 80,
  MIN_FIREFOX_VERSION: 75,
  MIN_SAFARI_VERSION: 13,
  MIN_EDGE_VERSION: 80
};

// 파일 크기 제한
export const FILE_SIZE_LIMITS = {
  MAX_EXPORT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMPORT_SIZE: 5 * 1024 * 1024,  // 5MB
  MAX_LOG_SIZE: 1 * 1024 * 1024      // 1MB
};