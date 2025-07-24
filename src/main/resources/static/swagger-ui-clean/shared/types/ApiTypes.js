/**
 * API 관련 타입 정의 및 검증 함수들
 */

/**
 * API 상태 타입을 검증합니다
 * @param {*} status 
 * @returns {boolean}
 */
export function isValidApiStatus(status) {
  const validStatuses = [
    '작업중', '작업완료', '업데이트', '작업안함',
    '테스트중', '테스트완료', '테스트실패', '테스트성공'
  ];
  return validStatuses.includes(status);
}

/**
 * HTTP 메서드 타입을 검증합니다
 * @param {*} method 
 * @returns {boolean}
 */
export function isValidHttpMethod(method) {
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  return validMethods.includes(method?.toString().toUpperCase());
}

/**
 * API 엔드포인트 객체가 유효한지 검증합니다
 * @param {*} endpoint 
 * @returns {boolean}
 */
export function isValidApiEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== 'object') {
    return false;
  }

  return (
    typeof endpoint.path === 'string' &&
    endpoint.path.length > 0 &&
    isValidHttpMethod(endpoint.method) &&
    typeof endpoint.tag === 'string'
  );
}

/**
 * API 그룹 객체가 유효한지 검증합니다
 * @param {*} group 
 * @returns {boolean}
 */
export function isValidApiGroup(group) {
  if (!group || typeof group !== 'object') {
    return false;
  }

  return (
    typeof group.name === 'string' &&
    group.name.length > 0 &&
    Array.isArray(group.apis)
  );
}

/**
 * Swagger 스펙 객체가 유효한지 검증합니다
 * @param {*} spec 
 * @returns {boolean}
 */
export function isValidSwaggerSpec(spec) {
  if (!spec || typeof spec !== 'object') {
    return false;
  }

  return (
    (spec.openapi || spec.swagger) &&
    spec.info &&
    typeof spec.info.title === 'string' &&
    typeof spec.info.version === 'string' &&
    typeof spec.paths === 'object'
  );
}

/**
 * 사이드바 상태 객체가 유효한지 검증합니다
 * @param {*} state 
 * @returns {boolean}
 */
export function isValidSidebarState(state) {
  if (!state || typeof state !== 'object') {
    return false;
  }

  return typeof state.isCollapsed === 'boolean';
}

/**
 * 모달 상태 객체가 유효한지 검증합니다
 * @param {*} state 
 * @returns {boolean}
 */
export function isValidModalState(state) {
  if (!state || typeof state !== 'object') {
    return false;
  }

  return (
    typeof state.isOpen === 'boolean' &&
    Array.isArray(state.categories) &&
    Array.isArray(state.subcategories) &&
    (state.selectedSubcategories instanceof Set || Array.isArray(state.selectedSubcategories))
  );
}

/**
 * 북마크 데이터가 유효한지 검증합니다
 * @param {*} bookmarks 
 * @returns {boolean}
 */
export function isValidBookmarks(bookmarks) {
  if (!Array.isArray(bookmarks)) {
    return false;
  }

  return bookmarks.every(bookmark => 
    typeof bookmark === 'string' && bookmark.length > 0
  );
}

/**
 * 날짜 문자열이 유효한지 검증합니다
 * @param {*} dateString 
 * @returns {boolean}
 */
export function isValidDateString(dateString) {
  if (typeof dateString !== 'string') {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * URL이 유효한지 검증합니다
 * @param {*} url 
 * @returns {boolean}
 */
export function isValidUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * API 경로가 유효한지 검증합니다
 * @param {*} path 
 * @returns {boolean}
 */
export function isValidApiPath(path) {
  if (typeof path !== 'string') {
    return false;
  }

  // 경로는 /로 시작해야 함
  return path.startsWith('/') && path.length > 1;
}

/**
 * 객체를 안전하게 복사합니다
 * @param {*} obj 
 * @returns {*}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj);
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }

  if (obj instanceof Set) {
    return new Set([...obj].map(item => deepClone(item)));
  }

  if (obj instanceof Map) {
    const clonedMap = new Map();
    for (const [key, value] of obj) {
      clonedMap.set(deepClone(key), deepClone(value));
    }
    return clonedMap;
  }

  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}

/**
 * 두 객체가 동일한지 비교합니다
 * @param {*} obj1 
 * @param {*} obj2 
 * @returns {boolean}
 */
export function deepEqual(obj1, obj2) {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }

  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  if (typeof obj1 !== 'object') {
    return obj1 === obj2;
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false;
    }

    if (!deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}