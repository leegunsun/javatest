/**
 * DOM 유틸리티
 * DOM 조작을 위한 공통 유틸리티 함수들을 제공합니다.
 */

/**
 * 요소를 선택합니다.
 * 
 * @param {string} selector CSS 선택자
 * @param {Element} context 검색 컨텍스트 (기본값: document)
 * @returns {Element|null} 선택된 요소
 */
export function querySelector(selector, context = document) {
  try {
    return context.querySelector(selector);
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * 여러 요소를 선택합니다.
 * 
 * @param {string} selector CSS 선택자
 * @param {Element} context 검색 컨텍스트 (기본값: document)
 * @returns {NodeList} 선택된 요소들
 */
export function querySelectorAll(selector, context = document) {
  try {
    return context.querySelectorAll(selector);
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return [];
  }
}

/**
 * ID로 요소를 선택합니다.
 * 
 * @param {string} id 요소 ID
 * @returns {Element|null} 선택된 요소
 */
export function getElementById(id) {
  return document.getElementById(id);
}

/**
 * 요소를 생성합니다.
 * 
 * @param {string} tagName 태그명
 * @param {Object} options 옵션
 * @param {string} options.className CSS 클래스명
 * @param {string} options.id 요소 ID
 * @param {string} options.textContent 텍스트 내용
 * @param {string} options.innerHTML HTML 내용
 * @param {Object} options.attributes 속성들
 * @param {Object} options.styles 스타일들
 * @returns {Element} 생성된 요소
 */
export function createElement(tagName, options = {}) {
  try {
    const element = document.createElement(tagName);
    
    if (options.className) {
      element.className = options.className;
    }
    
    if (options.id) {
      element.id = options.id;
    }
    
    if (options.textContent) {
      element.textContent = options.textContent;
    }
    
    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }
    
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    if (options.styles) {
      Object.entries(options.styles).forEach(([key, value]) => {
        element.style[key] = value;
      });
    }
    
    return element;
  } catch (error) {
    console.error(`Failed to create element: ${tagName}`, error);
    return null;
  }
}

/**
 * 요소에 클래스를 추가합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {...string} classNames 추가할 클래스명들
 */
export function addClass(element, ...classNames) {
  if (!element || !element.classList) return;
  
  classNames.forEach(className => {
    if (className && typeof className === 'string') {
      element.classList.add(className);
    }
  });
}

/**
 * 요소에서 클래스를 제거합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {...string} classNames 제거할 클래스명들
 */
export function removeClass(element, ...classNames) {
  if (!element || !element.classList) return;
  
  classNames.forEach(className => {
    if (className && typeof className === 'string') {
      element.classList.remove(className);
    }
  });
}

/**
 * 요소의 클래스를 토글합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} className 토글할 클래스명
 * @param {boolean} force 강제 설정 (true: 추가, false: 제거)
 * @returns {boolean} 클래스 존재 여부
 */
export function toggleClass(element, className, force = undefined) {
  if (!element || !element.classList) return false;
  
  return element.classList.toggle(className, force);
}

/**
 * 요소가 특정 클래스를 가지고 있는지 확인합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} className 확인할 클래스명
 * @returns {boolean} 클래스 존재 여부
 */
export function hasClass(element, className) {
  if (!element || !element.classList) return false;
  
  return element.classList.contains(className);
}

/**
 * 요소의 속성을 설정합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string|Object} name 속성명 또는 속성 객체
 * @param {string} value 속성값 (name이 문자열일 때)
 */
export function setAttribute(element, name, value = undefined) {
  if (!element) return;
  
  if (typeof name === 'object') {
    Object.entries(name).forEach(([key, val]) => {
      element.setAttribute(key, val);
    });
  } else if (typeof name === 'string' && value !== undefined) {
    element.setAttribute(name, value);
  }
}

/**
 * 요소의 속성을 가져옵니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} name 속성명
 * @returns {string|null} 속성값
 */
export function getAttribute(element, name) {
  if (!element) return null;
  
  return element.getAttribute(name);
}

/**
 * 요소의 속성을 제거합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {...string} names 제거할 속성명들
 */
export function removeAttribute(element, ...names) {
  if (!element) return;
  
  names.forEach(name => {
    if (name && typeof name === 'string') {
      element.removeAttribute(name);
    }
  });
}

/**
 * 요소의 스타일을 설정합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string|Object} property 속성명 또는 스타일 객체
 * @param {string} value 속성값 (property가 문자열일 때)
 */
export function setStyle(element, property, value = undefined) {
  if (!element || !element.style) return;
  
  if (typeof property === 'object') {
    Object.entries(property).forEach(([key, val]) => {
      element.style[key] = val;
    });
  } else if (typeof property === 'string' && value !== undefined) {
    element.style[property] = value;
  }
}

/**
 * 요소의 스타일을 가져옵니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} property 속성명
 * @returns {string} 속성값
 */
export function getStyle(element, property) {
  if (!element) return '';
  
  return window.getComputedStyle(element)[property] || element.style[property] || '';
}

/**
 * 요소를 표시합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} display 표시 방식 (기본값: 'block')
 */
export function show(element, display = 'block') {
  if (!element) return;
  
  element.style.display = display;
}

/**
 * 요소를 숨깁니다.
 * 
 * @param {Element} element 대상 요소
 */
export function hide(element) {
  if (!element) return;
  
  element.style.display = 'none';
}

/**
 * 요소의 표시 상태를 토글합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} display 표시 방식 (기본값: 'block')
 */
export function toggle(element, display = 'block') {
  if (!element) return;
  
  const currentDisplay = getStyle(element, 'display');
  if (currentDisplay === 'none' || !currentDisplay) {
    show(element, display);
  } else {
    hide(element);
  }
}

/**
 * 요소가 표시되고 있는지 확인합니다.
 * 
 * @param {Element} element 대상 요소
 * @returns {boolean} 표시 여부
 */
export function isVisible(element) {
  if (!element) return false;
  
  return element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;
}

/**
 * 요소에 이벤트 리스너를 추가합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} event 이벤트 타입
 * @param {Function} handler 이벤트 핸들러
 * @param {boolean|Object} options 이벤트 옵션
 */
export function addEventListener(element, event, handler, options = false) {
  if (!element || typeof handler !== 'function') return;
  
  element.addEventListener(event, handler, options);
}

/**
 * 요소에서 이벤트 리스너를 제거합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} event 이벤트 타입
 * @param {Function} handler 이벤트 핸들러
 * @param {boolean|Object} options 이벤트 옵션
 */
export function removeEventListener(element, event, handler, options = false) {
  if (!element || typeof handler !== 'function') return;
  
  element.removeEventListener(event, handler, options);
}

/**
 * 커스텀 이벤트를 생성하고 발생시킵니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} eventType 이벤트 타입
 * @param {any} detail 이벤트 세부 데이터
 * @param {Object} options 이벤트 옵션
 */
export function dispatchCustomEvent(element, eventType, detail = null, options = {}) {
  if (!element) return;
  
  const event = new CustomEvent(eventType, {
    detail,
    bubbles: options.bubbles !== false,
    cancelable: options.cancelable !== false,
    ...options
  });
  
  element.dispatchEvent(event);
}

/**
 * 요소를 부모에서 제거합니다.
 * 
 * @param {Element} element 제거할 요소
 */
export function remove(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * 요소의 모든 자식을 제거합니다.
 * 
 * @param {Element} element 대상 요소
 */
export function empty(element) {
  if (!element) return;
  
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * 요소를 부모의 특정 위치에 삽입합니다.
 * 
 * @param {Element} parent 부모 요소
 * @param {Element} element 삽입할 요소
 * @param {number} index 삽입 위치 (기본값: 마지막)
 */
export function insertAt(parent, element, index = -1) {
  if (!parent || !element) return;
  
  if (index < 0 || index >= parent.children.length) {
    parent.appendChild(element);
  } else {
    parent.insertBefore(element, parent.children[index]);
  }
}

/**
 * 요소의 위치 정보를 가져옵니다.
 * 
 * @param {Element} element 대상 요소
 * @returns {Object} 위치 정보
 */
export function getPosition(element) {
  if (!element) return { top: 0, left: 0, width: 0, height: 0 };
  
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
    width: rect.width,
    height: rect.height
  };
}

/**
 * 요소가 뷰포트에 보이는지 확인합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {number} threshold 임계값 (0-1)
 * @returns {boolean} 가시성 여부
 */
export function isInViewport(element, threshold = 0) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
  const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);
  
  return vertInView && horInView;
}

/**
 * 요소로 부드럽게 스크롤합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {Object} options 스크롤 옵션
 */
export function scrollToElement(element, options = {}) {
  if (!element) return;
  
  element.scrollIntoView({
    behavior: options.behavior || 'smooth',
    block: options.block || 'start',
    inline: options.inline || 'nearest',
    ...options
  });
}

/**
 * 안전한 innerHTML 설정 (XSS 방지)
 * 
 * @param {Element} element 대상 요소
 * @param {string} html HTML 문자열
 */
export function safeSetInnerHTML(element, html) {
  if (!element) return;
  
  // 간단한 HTML 새니타이징 (실제 프로덕션에서는 DOMPurify 같은 라이브러리 사용 권장)
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  element.innerHTML = sanitized;
}

/**
 * 요소의 데이터 속성을 가져옵니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string} key 데이터 키
 * @returns {string|null} 데이터 값
 */
export function getData(element, key) {
  if (!element || !element.dataset) return null;
  
  return element.dataset[key] || null;
}

/**
 * 요소의 데이터 속성을 설정합니다.
 * 
 * @param {Element} element 대상 요소
 * @param {string|Object} key 데이터 키 또는 데이터 객체
 * @param {string} value 데이터 값 (key가 문자열일 때)
 */
export function setData(element, key, value = undefined) {
  if (!element || !element.dataset) return;
  
  if (typeof key === 'object') {
    Object.entries(key).forEach(([k, v]) => {
      element.dataset[k] = v;
    });
  } else if (typeof key === 'string' && value !== undefined) {
    element.dataset[key] = value;
  }
}