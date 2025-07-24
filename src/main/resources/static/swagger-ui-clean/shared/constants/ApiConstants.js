/**
 * API 관련 상수들
 */
export const API_STATUS = {
  WORKING: '작업중',
  COMPLETED: '작업완료',
  UPDATED: '업데이트',
  NOT_WORKING: '작업안함',
  TESTING: '테스트중',
  TEST_COMPLETED: '테스트완료',
  TEST_FAILED: '테스트실패',
  TEST_SUCCESS: '테스트성공'
};

export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD'
};

export const API_ENDPOINTS = {
  API_DOCS: '/v3/api-docs',
  API_STATUS: '/swagger-status/api-status.json',
  API_META: '/swagger-status/api-meta.json'
};

export const STORAGE_KEYS = {
  BOOKMARKS: 'swagger_bookmarks',
  SIDEBAR_STATE: 'swagger_sidebar_state',
  MODAL_STATE: 'swagger_modal_state',
  USED_PATHS: 'swagger_used_paths',
  CONVERT_SPEC: 'swagger_convert_spec'
};

export const CSS_CLASSES = {
  STATUS: {
    WORKING: 'status-작업중',
    COMPLETED: 'status-작업완료',
    UPDATED: 'status-업데이트',
    NOT_WORKING: 'status-작업안함',
    TESTING: 'status-테스트중',
    TEST_COMPLETED: 'status-테스트완료',
    TEST_FAILED: 'status-테스트실패',
    TEST_SUCCESS: 'status-테스트성공'
  },
  BADGE: {
    WORKING: 'badge-작업중',
    COMPLETED: 'badge-작업완료',
    UPDATED: 'badge-업데이트',
    NOT_WORKING: 'badge-작업안함',
    TESTING: 'badge-테스트중',
    TEST_COMPLETED: 'badge-테스트완료',
    TEST_FAILED: 'badge-테스트실패',
    TEST_SUCCESS: 'badge-테스트성공'
  },
  HIGHLIGHT: {
    NEW_API: 'new-api',
    BOOKMARKED: 'bookmarked',
    DRAGGING: 'dragging',
    DRAG_OVER: 'drag-over'
  }
};

export const UI_CONFIG = {
  NEW_API_THRESHOLD_DAYS: 30,
  MODAL_ANIMATION_DURATION: 300,
  SIDEBAR_TRANSITION_DURATION: 300,
  HIGHLIGHT_FADE_DURATION: 5000
};

export const ERROR_MESSAGES = {
  API_LOAD_FAILED: 'API 데이터를 불러오는데 실패했습니다',
  SWAGGER_INIT_FAILED: 'Swagger UI 초기화에 실패했습니다',
  BOOKMARK_SAVE_FAILED: '북마크 저장에 실패했습니다',
  STORAGE_ACCESS_FAILED: '저장소 접근에 실패했습니다',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다'
};

export const DEFAULT_VALUES = {
  EMPTY_SPEC: {
    openapi: '3.0.0',
    info: {
      title: 'Empty API',
      version: '1.0.0'
    },
    paths: {}
  },
  SIDEBAR_STATE: {
    isCollapsed: false
  },
  MODAL_STATE: {
    isOpen: false,
    selectedCategory: null,
    selectedSubcategories: []
  }
};