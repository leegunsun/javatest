/**
 * DOM 조작 관련 유틸리티 함수들
 */
export class DomUtils {
  /**
   * 요소를 찾습니다 (null 안전)
   * @param {string} selector 
   * @param {Element} parent 
   * @returns {Element|null}
   */
  static findElement(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.error(`요소 찾기 실패 (${selector}):`, error);
      return null;
    }
  }

  /**
   * 여러 요소를 찾습니다
   * @param {string} selector 
   * @param {Element} parent 
   * @returns {NodeList}
   */
  static findElements(selector, parent = document) {
    try {
      return parent.querySelectorAll(selector);
    } catch (error) {
      console.error(`요소들 찾기 실패 (${selector}):`, error);
      return [];
    }
  }

  /**
   * 요소를 생성합니다
   * @param {string} tagName 
   * @param {Object} attributes 
   * @param {string} textContent 
   * @returns {HTMLElement}
   */
  static createElement(tagName, attributes = {}, textContent = '') {
    try {
      const element = document.createElement(tagName);
      
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'dataset') {
          Object.entries(value).forEach(([dataKey, dataValue]) => {
            element.dataset[dataKey] = dataValue;
          });
        } else {
          element.setAttribute(key, value);
        }
      });

      if (textContent) {
        element.textContent = textContent;
      }

      return element;
    } catch (error) {
      console.error('요소 생성 실패:', error);
      return document.createElement('div');
    }
  }

  /**
   * CSS 클래스를 토글합니다
   * @param {Element} element 
   * @param {string} className 
   * @param {boolean} force 
   * @returns {boolean}
   */
  static toggleClass(element, className, force = undefined) {
    if (!element) return false;
    
    try {
      return element.classList.toggle(className, force);
    } catch (error) {
      console.error('클래스 토글 실패:', error);
      return false;
    }
  }

  /**
   * 여러 CSS 클래스를 추가합니다
   * @param {Element} element 
   * @param {...string} classNames 
   */
  static addClasses(element, ...classNames) {
    if (!element) return;
    
    try {
      element.classList.add(...classNames);
    } catch (error) {
      console.error('클래스 추가 실패:', error);
    }
  }

  /**
   * 여러 CSS 클래스를 제거합니다
   * @param {Element} element 
   * @param {...string} classNames 
   */
  static removeClasses(element, ...classNames) {
    if (!element) return;
    
    try {
      element.classList.remove(...classNames);
    } catch (error) {
      console.error('클래스 제거 실패:', error);
    }
  }

  /**
   * 요소에 이벤트 리스너를 추가합니다 (에러 처리 포함)
   * @param {Element} element 
   * @param {string} event 
   * @param {Function} handler 
   * @param {Object} options 
   */
  static addEventListener(element, event, handler, options = {}) {
    if (!element || typeof handler !== 'function') return;
    
    try {
      const wrappedHandler = (e) => {
        try {
          handler(e);
        } catch (error) {
          console.error(`이벤트 핸들러 실행 실패 (${event}):`, error);
        }
      };
      
      element.addEventListener(event, wrappedHandler, options);
    } catch (error) {
      console.error(`이벤트 리스너 추가 실패 (${event}):`, error);
    }
  }

  /**
   * 요소의 내용을 안전하게 설정합니다
   * @param {Element} element 
   * @param {string} content 
   * @param {boolean} isHTML 
   */
  static setContent(element, content, isHTML = false) {
    if (!element) return;
    
    try {
      if (isHTML) {
        element.innerHTML = content;
      } else {
        element.textContent = content;
      }
    } catch (error) {
      console.error('콘텐츠 설정 실패:', error);
    }
  }

  /**
   * 요소를 안전하게 제거합니다
   * @param {Element} element 
   */
  static removeElement(element) {
    if (!element) return;
    
    try {
      element.remove();
    } catch (error) {
      console.error('요소 제거 실패:', error);
    }
  }

  /**
   * 요소가 뷰포트에 보이는지 확인합니다
   * @param {Element} element 
   * @returns {boolean}
   */
  static isElementVisible(element) {
    if (!element) return false;
    
    try {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    } catch (error) {
      console.error('요소 가시성 확인 실패:', error);
      return false;
    }
  }

  /**
   * 요소를 뷰포트로 스크롤합니다
   * @param {Element} element 
   * @param {Object} options 
   */
  static scrollToElement(element, options = { behavior: 'smooth', block: 'center' }) {
    if (!element) return;
    
    try {
      element.scrollIntoView(options);
    } catch (error) {
      console.error('요소 스크롤 실패:', error);
    }
  }

  /**
   * 요소의 계산된 스타일을 가져옵니다
   * @param {Element} element 
   * @param {string} property 
   * @returns {string}
   */
  static getComputedStyle(element, property) {
    if (!element) return '';
    
    try {
      const computedStyle = window.getComputedStyle(element);
      return property ? computedStyle.getPropertyValue(property) : computedStyle;
    } catch (error) {
      console.error('계산된 스타일 가져오기 실패:', error);
      return '';
    }
  }

  /**
   * 요소에 애니메이션을 적용합니다
   * @param {Element} element 
   * @param {Object} keyframes 
   * @param {Object} options 
   * @returns {Animation}
   */
  static animate(element, keyframes, options = {}) {
    if (!element) return null;
    
    try {
      return element.animate(keyframes, {
        duration: 300,
        easing: 'ease-in-out',
        ...options
      });
    } catch (error) {
      console.error('애니메이션 적용 실패:', error);
      return null;
    }
  }

  /**
   * 디바운스된 함수를 생성합니다
   * @param {Function} func 
   * @param {number} delay 
   * @returns {Function}
   */
  static debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 스로틀링된 함수를 생성합니다
   * @param {Function} func 
   * @param {number} limit 
   * @returns {Function}
   */
  static throttle(func, limit = 100) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}