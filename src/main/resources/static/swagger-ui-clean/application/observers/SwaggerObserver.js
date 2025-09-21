/**
 * Swagger 옵저버
 * Swagger UI의 DOM 변화를 감지하고 커스텀 기능을 적용하는 애플리케이션 계층 옵저버입니다.
 */
export class SwaggerObserver {
  constructor() {
    this.observers = [];
    this.mutationObserver = null;
    this.isObserving = false;
    this.observedElements = new Map();
    this.callbacks = new Map();
  }

  /**
   * 옵저버를 시작합니다.
   * 
   * @param {string} targetSelector 관찰할 대상 선택자
   */
  start(targetSelector = '#swagger-ui') {
    if (this.isObserving) {
      this.stop();
    }

    try {
      const targetElement = document.querySelector(targetSelector);
      if (!targetElement) {
        console.warn(`Target element ${targetSelector} not found`);
        return;
      }

      this.mutationObserver = new MutationObserver((mutations) => {
        this.handleMutations(mutations);
      });

      this.mutationObserver.observe(targetElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        characterData: true
      });

      this.isObserving = true;
      console.log('Swagger observer started');
    } catch (error) {
      console.error('Failed to start Swagger observer:', error);
    }
  }

  /**
   * 옵저버를 중지합니다.
   */
  stop() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    this.isObserving = false;
    this.observedElements.clear();
    console.log('Swagger observer stopped');
  }

  /**
   * DOM 변화를 처리합니다.
   * 
   * @param {MutationRecord[]} mutations 변화 기록
   */
  handleMutations(mutations) {
    try {
      const processedNodes = new Set();

      mutations.forEach(mutation => {
        switch (mutation.type) {
          case 'childList':
            this.handleChildListMutation(mutation, processedNodes);
            break;
          case 'attributes':
            this.handleAttributeMutation(mutation);
            break;
          case 'characterData':
            this.handleCharacterDataMutation(mutation);
            break;
        }
      });

      this.notifyObservers('mutations-processed', mutations);
    } catch (error) {
      console.error('Error handling mutations:', error);
    }
  }

  /**
   * 자식 노드 변화를 처리합니다.
   * 
   * @param {MutationRecord} mutation 변화 기록
   * @param {Set} processedNodes 처리된 노드 집합
   */
  handleChildListMutation(mutation, processedNodes) {
    // 추가된 노드 처리
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && !processedNodes.has(node)) {
        this.handleAddedElement(node);
        processedNodes.add(node);
      }
    });

    // 제거된 노드 처리
    mutation.removedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        this.handleRemovedElement(node);
      }
    });
  }

  /**
   * 속성 변화를 처리합니다.
   * 
   * @param {MutationRecord} mutation 변화 기록
   */
  handleAttributeMutation(mutation) {
    const element = mutation.target;
    const attributeName = mutation.attributeName;
    const oldValue = mutation.oldValue;
    const newValue = element.getAttribute(attributeName);

    this.notifyObservers('attribute-changed', {
      element,
      attributeName,
      oldValue,
      newValue
    });
  }

  /**
   * 텍스트 내용 변화를 처리합니다.
   * 
   * @param {MutationRecord} mutation 변화 기록
   */
  handleCharacterDataMutation(mutation) {
    const node = mutation.target;
    const oldValue = mutation.oldValue;
    const newValue = node.textContent;

    this.notifyObservers('text-changed', {
      node,
      oldValue,
      newValue
    });
  }

  /**
   * 추가된 요소를 처리합니다.
   * 
   * @param {Element} element 추가된 요소
   */
  handleAddedElement(element) {
    try {
      // API 블록 감지
      if (this.isApiBlock(element)) {
        this.handleApiBlockAdded(element);
      }

      // 모델 섹션 감지
      if (this.isModelSection(element)) {
        this.handleModelSectionAdded(element);
      }

      // 스키마 테이블 감지
      if (this.isSchemaTable(element)) {
        this.handleSchemaTableAdded(element);
      }

      // 서버 드롭다운 감지
      if (this.isServerDropdown(element)) {
        this.handleServerDropdownAdded(element);
      }

      this.notifyObservers('element-added', element);
    } catch (error) {
      console.error('Error handling added element:', error);
    }
  }

  /**
   * 제거된 요소를 처리합니다.
   * 
   * @param {Element} element 제거된 요소
   */
  handleRemovedElement(element) {
    try {
      // 관찰 중인 요소에서 제거
      this.observedElements.delete(element);
      
      this.notifyObservers('element-removed', element);
    } catch (error) {
      console.error('Error handling removed element:', error);
    }
  }

  /**
   * API 블록이 추가되었을 때 처리합니다.
   * 
   * @param {Element} element API 블록 요소
   */
  handleApiBlockAdded(element) {
    try {
      // API 상태 하이라이팅 적용
      this.applyStatusHighlighting(element);
      
      // 새로운 API 하이라이팅 적용
      this.applyNewAPIHighlighting(element);
      
      // 설명 접두어 추가
      this.applyDescriptionPrefix(element);

      this.notifyObservers('api-block-added', element);
    } catch (error) {
      console.error('Error handling API block:', error);
    }
  }

  /**
   * 모델 섹션이 추가되었을 때 처리합니다.
   * 
   * @param {Element} element 모델 섹션 요소
   */
  handleModelSectionAdded(element) {
    try {
      // 새로운 모델 하이라이팅 적용
      this.applyNewModelHighlighting(element);

      this.notifyObservers('model-section-added', element);
    } catch (error) {
      console.error('Error handling model section:', error);
    }
  }

  /**
   * 스키마 테이블이 추가되었을 때 처리합니다.
   * 
   * @param {Element} element 스키마 테이블 요소
   */
  handleSchemaTableAdded(element) {
    try {
      // 스키마 테이블 개선 적용
      this.enhanceSchemaTable(element);

      this.notifyObservers('schema-table-added', element);
    } catch (error) {
      console.error('Error handling schema table:', error);
    }
  }

  /**
   * 서버 드롭다운이 추가되었을 때 처리합니다.
   * 
   * @param {Element} element 서버 드롭다운 요소
   */
  handleServerDropdownAdded(element) {
    try {
      // 드롭다운 상태 복원
      this.restoreDropdownState(element);

      this.notifyObservers('server-dropdown-added', element);
    } catch (error) {
      console.error('Error handling server dropdown:', error);
    }
  }

  /**
   * API 블록인지 확인합니다.
   * 
   * @param {Element} element 확인할 요소
   * @returns {boolean} API 블록 여부
   */
  isApiBlock(element) {
    return element.classList && element.classList.contains('opblock');
  }

  /**
   * 모델 섹션인지 확인합니다.
   * 
   * @param {Element} element 확인할 요소
   * @returns {boolean} 모델 섹션 여부
   */
  isModelSection(element) {
    return element.classList && (
      element.classList.contains('models') ||
      element.classList.contains('model-container')
    );
  }

  /**
   * 스키마 테이블인지 확인합니다.
   * 
   * @param {Element} element 확인할 요소
   * @returns {boolean} 스키마 테이블 여부
   */
  isSchemaTable(element) {
    return element.tagName === 'TABLE' && 
           element.classList && 
           element.classList.contains('model');
  }

  /**
   * 서버 드롭다운인지 확인합니다.
   * 
   * @param {Element} element 확인할 요소
   * @returns {boolean} 서버 드롭다운 여부
   */
  isServerDropdown(element) {
    return element.id === 'servers' || 
           (element.tagName === 'SELECT' && element.name === 'servers');
  }

  /**
   * API 상태 하이라이팅을 적용합니다.
   * 
   * @param {Element} element API 블록 요소
   */
  applyStatusHighlighting(element) {
    // 상태 하이라이팅 로직 구현
    // 기존 statusHighlighter.js의 로직을 여기에 통합
  }

  /**
   * 새로운 API 하이라이팅을 적용합니다.
   * 
   * @param {Element} element API 블록 요소
   */
  applyNewAPIHighlighting(element) {
    // 새로운 API 하이라이팅 로직 구현
    // 기존 newApiHighlighter.js의 로직을 여기에 통합
  }

  /**
   * 새로운 모델 하이라이팅을 적용합니다.
   * 
   * @param {Element} element 모델 섹션 요소
   */
  applyNewModelHighlighting(element) {
    // 새로운 모델 하이라이팅 로직 구현
    // 기존 newModelHighlighter.js의 로직을 여기에 통합
  }

  /**
   * 설명 접두어를 추가합니다.
   * 
   * @param {Element} element API 블록 요소
   */
  applyDescriptionPrefix(element) {
    // 설명 접두어 로직 구현
    // 기존 descriptionPrefixer.js의 로직을 여기에 통합
  }

  /**
   * 스키마 테이블을 개선합니다.
   * 
   * @param {Element} element 스키마 테이블 요소
   */
  enhanceSchemaTable(element) {
    // 스키마 테이블 개선 로직 구현
  }

  /**
   * 드롭다운 상태를 복원합니다.
   * 
   * @param {Element} element 드롭다운 요소
   */
  restoreDropdownState(element) {
    // 드롭다운 상태 복원 로직 구현
  }

  /**
   * 특정 요소의 변화를 감지하는 콜백을 등록합니다.
   * 
   * @param {string} selector CSS 선택자
   * @param {Function} callback 콜백 함수
   */
  watchElement(selector, callback) {
    if (!this.callbacks.has(selector)) {
      this.callbacks.set(selector, []);
    }

    this.callbacks.get(selector).push(callback);
  }

  /**
   * 요소 감시를 해제합니다.
   * 
   * @param {string} selector CSS 선택자
   * @param {Function} callback 제거할 콜백 함수
   */
  unwatchElement(selector, callback = null) {
    if (!this.callbacks.has(selector)) {
      return;
    }

    if (callback) {
      const callbacks = this.callbacks.get(selector);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.callbacks.delete(selector);
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
   * 옵저버 상태를 반환합니다.
   * 
   * @returns {Object} 옵저버 상태
   */
  getStatus() {
    return {
      isObserving: this.isObserving,
      observedElementsCount: this.observedElements.size,
      callbacksCount: this.callbacks.size,
      observersCount: this.observers.length
    };
  }

  /**
   * 옵저버를 초기화합니다.
   */
  reset() {
    this.stop();
    this.observers = [];
    this.observedElements.clear();
    this.callbacks.clear();
  }
}