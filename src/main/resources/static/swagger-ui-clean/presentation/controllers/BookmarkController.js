/**
 * 북마크 컨트롤러
 * 북마크 관련 UI와 사용자 상호작용을 관리하는 프레젠테이션 계층 컨트롤러입니다.
 */
export class BookmarkController {
  constructor(bookmarkService, apiDataService) {
    this.bookmarkService = bookmarkService;
    this.apiDataService = apiDataService;
    
    this.currentCategories = [];
    this.currentSubcategories = [];
    this.selectedItems = new Set();
    this.isModalOpen = false;
    
    this.initializeEventHandlers();
  }

  /**
   * 컨트롤러를 초기화합니다.
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // 북마크 서비스 초기화
      await this.bookmarkService.initialize();
      
      // 사이드바 렌더링
      this.renderBookmarkSidebar();
      
      console.log('Bookmark controller initialized');
    } catch (error) {
      console.error('Failed to initialize bookmark controller:', error);
      throw error;
    }
  }

  /**
   * 이벤트 핸들러들을 초기화합니다.
   */
  initializeEventHandlers() {
    // 북마크 서비스 이벤트 핸들러
    this.bookmarkService.addObserver((event, data) => {
      this.handleBookmarkServiceEvent(event, data);
    });
  }

  /**
   * 북마크 서비스 이벤트를 처리합니다.
   * 
   * @param {string} event 이벤트명
   * @param {any} data 이벤트 데이터
   */
  handleBookmarkServiceEvent(event, data) {
    switch (event) {
      case 'bookmarks-changed':
        this.renderBookmarkSidebar();
        break;
      case 'bookmark-error':
        this.showError(data.error);
        break;
    }
  }

  /**
   * 북마크 모달을 엽니다.
   */
  openModal() {
    try {
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.remove('hidden');
        this.isModalOpen = true;
        this.loadModalData();
      }
    } catch (error) {
      console.error('Failed to open bookmark modal:', error);
    }
  }

  /**
   * 북마크 모달을 닫습니다.
   */
  closeModal() {
    try {
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.add('hidden');
        this.isModalOpen = false;
        this.resetModalState();
      }
    } catch (error) {
      console.error('Failed to close bookmark modal:', error);
    }
  }

  /**
   * 모달 데이터를 로드합니다.
   */
  async loadModalData() {
    try {
      // API 데이터에서 카테고리 목록 생성
      const statistics = this.apiDataService.getStatistics();
      const metadataMap = this.apiDataService.cachedData?.metadataMap || {};
      
      this.currentCategories = this.extractCategories(metadataMap);
      this.renderCategoryList();
      
      // 기존 북마크 선택 상태 복원
      this.restoreSelectedItems();
    } catch (error) {
      console.error('Failed to load modal data:', error);
    }
  }

  /**
   * 메타데이터에서 카테고리를 추출합니다.
   * 
   * @param {Object} metadataMap 메타데이터 맵
   * @returns {Array} 카테고리 목록
   */
  extractCategories(metadataMap) {
    const categories = [];
    const tagMap = new Map();

    Object.values(metadataMap).forEach(metadata => {
      const tag = metadata.getTag();
      const tagName = tag.name;
      
      if (!tagMap.has(tagName)) {
        tagMap.set(tagName, {
          name: tagName,
          description: tag.description,
          controllers: []
        });
      }

      tagMap.get(tagName).controllers.push({
        controllerName: metadata.getControllerName(),
        methods: metadata.getAllMethods(),
        metadata
      });
    });

    return Array.from(tagMap.values());
  }

  /**
   * 카테고리 목록을 렌더링합니다.
   */
  renderCategoryList() {
    try {
      const categoryList = document.getElementById('category-list');
      if (!categoryList) return;

      categoryList.innerHTML = '';

      this.currentCategories.forEach(category => {
        const categoryElement = this.createCategoryElement(category);
        categoryList.appendChild(categoryElement);
      });
    } catch (error) {
      console.error('Failed to render category list:', error);
    }
  }

  /**
   * 카테고리 요소를 생성합니다.
   * 
   * @param {Object} category 카테고리 데이터
   * @returns {HTMLElement} 카테고리 요소
   */
  createCategoryElement(category) {
    const element = document.createElement('div');
    element.className = 'selectCategory';
    element.textContent = category.name;
    element.title = category.description;

    element.addEventListener('click', () => {
      this.selectCategory(category);
    });

    return element;
  }

  /**
   * 카테고리를 선택합니다.
   * 
   * @param {Object} category 선택된 카테고리
   */
  selectCategory(category) {
    try {
      // 이전 선택 해제
      document.querySelectorAll('.selectCategory').forEach(el => {
        el.classList.remove('selectCategory-disabled');
      });

      // 현재 선택 표시
      event.target.classList.add('selectCategory-disabled');

      // 서브카테고리 생성
      this.currentSubcategories = this.extractSubcategories(category);
      this.renderSubcategoryList();
    } catch (error) {
      console.error('Failed to select category:', error);
    }
  }

  /**
   * 카테고리에서 서브카테고리를 추출합니다.
   * 
   * @param {Object} category 카테고리 데이터
   * @returns {Array} 서브카테고리 목록
   */
  extractSubcategories(category) {
    const subcategories = [];

    category.controllers.forEach(controller => {
      Object.entries(controller.methods).forEach(([methodName, methodInfo]) => {
        const pathParts = this.extractPathParts(controller.controllerName);
        
        subcategories.push({
          rootTagName: category.name,
          subTagName: `${methodName}_${pathParts.subPath}`,
          method: this.inferHttpMethod(methodName),
          rootPath: pathParts.rootPath,
          subPath: pathParts.subPath,
          displayName: `${methodName} (${pathParts.rootPath}/${pathParts.subPath})`,
          methodInfo
        });
      });
    });

    return subcategories;
  }

  /**
   * 컨트롤러명에서 경로 부분을 추출합니다.
   * 
   * @param {string} controllerName 컨트롤러명
   * @returns {Object} 경로 정보
   */
  extractPathParts(controllerName) {
    // 컨트롤러명에서 경로 추출 로직
    const parts = controllerName.split('.');
    const className = parts[parts.length - 1];
    const pathName = className.replace('Controller', '').toLowerCase();
    
    return {
      rootPath: pathName,
      subPath: pathName
    };
  }

  /**
   * 메서드명에서 HTTP 메서드를 추론합니다.
   * 
   * @param {string} methodName 메서드명
   * @returns {string} HTTP 메서드
   */
  inferHttpMethod(methodName) {
    const lowerMethodName = methodName.toLowerCase();
    
    if (lowerMethodName.startsWith('get')) return 'GET';
    if (lowerMethodName.startsWith('post') || lowerMethodName.startsWith('create') || lowerMethodName.startsWith('register')) return 'POST';
    if (lowerMethodName.startsWith('put') || lowerMethodName.startsWith('update') || lowerMethodName.startsWith('modify')) return 'PUT';
    if (lowerMethodName.startsWith('delete') || lowerMethodName.startsWith('remove')) return 'DELETE';
    
    return 'GET'; // 기본값
  }

  /**
   * 서브카테고리 목록을 렌더링합니다.
   */
  renderSubcategoryList() {
    try {
      const subcategoryList = document.getElementById('subcategory-list');
      if (!subcategoryList) return;

      subcategoryList.innerHTML = '';

      this.currentSubcategories.forEach(subcategory => {
        const subcategoryElement = this.createSubcategoryElement(subcategory);
        subcategoryList.appendChild(subcategoryElement);
      });
    } catch (error) {
      console.error('Failed to render subcategory list:', error);
    }
  }

  /**
   * 서브카테고리 요소를 생성합니다.
   * 
   * @param {Object} subcategory 서브카테고리 데이터
   * @returns {HTMLElement} 서브카테고리 요소
   */
  createSubcategoryElement(subcategory) {
    const element = document.createElement('div');
    element.textContent = subcategory.displayName;

    element.addEventListener('click', () => {
      this.toggleSubcategory(subcategory, element);
    });

    return element;
  }

  /**
   * 서브카테고리를 토글합니다.
   * 
   * @param {Object} subcategory 서브카테고리 데이터
   * @param {HTMLElement} element 서브카테고리 요소
   */
  toggleSubcategory(subcategory, element) {
    try {
      const itemKey = this.getItemKey(subcategory);
      
      if (this.selectedItems.has(itemKey)) {
        this.selectedItems.delete(itemKey);
        element.classList.remove('subcategory-disabled');
      } else {
        this.selectedItems.add(itemKey);
        element.classList.add('subcategory-disabled');
      }

      this.renderSelectedItems();
    } catch (error) {
      console.error('Failed to toggle subcategory:', error);
    }
  }

  /**
   * 선택된 아이템들을 렌더링합니다.
   */
  renderSelectedItems() {
    try {
      const selectedContainer = document.getElementById('selected-subcategories');
      if (!selectedContainer) return;

      selectedContainer.innerHTML = '';

      this.selectedItems.forEach(itemKey => {
        const subcategory = this.findSubcategoryByKey(itemKey);
        if (subcategory) {
          const itemElement = this.createSelectedItemElement(subcategory);
          selectedContainer.appendChild(itemElement);
        }
      });
    } catch (error) {
      console.error('Failed to render selected items:', error);
    }
  }

  /**
   * 선택된 아이템 요소를 생성합니다.
   * 
   * @param {Object} subcategory 서브카테고리 데이터
   * @returns {HTMLElement} 선택된 아이템 요소
   */
  createSelectedItemElement(subcategory) {
    const element = document.createElement('div');
    element.className = 'selected-item';
    element.innerHTML = `
      <span>${subcategory.displayName}</span>
      <button class="remove-btn" data-key="${this.getItemKey(subcategory)}">×</button>
    `;

    // 제거 버튼 이벤트
    const removeBtn = element.querySelector('.remove-btn');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeSelectedItem(subcategory);
    });

    return element;
  }

  /**
   * 선택된 아이템을 제거합니다.
   * 
   * @param {Object} subcategory 제거할 서브카테고리
   */
  removeSelectedItem(subcategory) {
    try {
      const itemKey = this.getItemKey(subcategory);
      this.selectedItems.delete(itemKey);
      this.renderSelectedItems();
      
      // 서브카테고리 목록에서도 선택 해제 표시
      this.updateSubcategorySelection();
    } catch (error) {
      console.error('Failed to remove selected item:', error);
    }
  }

  /**
   * 서브카테고리 선택 상태를 업데이트합니다.
   */
  updateSubcategorySelection() {
    try {
      const subcategoryElements = document.querySelectorAll('#subcategory-list > div');
      
      subcategoryElements.forEach((element, index) => {
        const subcategory = this.currentSubcategories[index];
        if (subcategory) {
          const itemKey = this.getItemKey(subcategory);
          if (this.selectedItems.has(itemKey)) {
            element.classList.add('subcategory-disabled');
          } else {
            element.classList.remove('subcategory-disabled');
          }
        }
      });
    } catch (error) {
      console.error('Failed to update subcategory selection:', error);
    }
  }

  /**
   * 북마크 설정을 저장합니다.
   */
  async saveBookmarkSettings() {
    try {
      // 선택된 아이템들을 북마크로 저장
      const bookmarksToAdd = [];
      
      this.selectedItems.forEach(itemKey => {
        const subcategory = this.findSubcategoryByKey(itemKey);
        if (subcategory) {
          bookmarksToAdd.push({
            rootTagName: subcategory.rootTagName,
            subTagName: subcategory.subTagName,
            method: subcategory.method,
            rootPath: subcategory.rootPath,
            subPath: subcategory.subPath
          });
        }
      });

      // 기존 북마크 클리어 후 새로 추가
      await this.bookmarkService.clearAllBookmarks();
      const result = await this.bookmarkService.addMultipleBookmarks(bookmarksToAdd);
      
      console.log(`Saved ${result.success} bookmarks`);
      this.closeModal();
    } catch (error) {
      console.error('Failed to save bookmark settings:', error);
      this.showError('북마크 저장에 실패했습니다.');
    }
  }

  /**
   * 기존 북마크 선택 상태를 복원합니다.
   */
  restoreSelectedItems() {
    try {
      const existingBookmarks = this.bookmarkService.getCurrentBookmarks();
      this.selectedItems.clear();
      
      existingBookmarks.forEach(bookmark => {
        const itemKey = this.getItemKey(bookmark);
        this.selectedItems.add(itemKey);
      });
      
      this.renderSelectedItems();
    } catch (error) {
      console.error('Failed to restore selected items:', error);
    }
  }

  /**
   * 북마크 사이드바를 렌더링합니다.
   */
  renderBookmarkSidebar() {
    try {
      const bookmarkTree = document.getElementById('custom-api-tree');
      if (!bookmarkTree) return;

      // 기존 내용 제거 (첫 번째 항목 제외)
      const children = Array.from(bookmarkTree.children);
      children.slice(1).forEach(child => child.remove());

      // 북마크별 그룹 생성
      const bookmarksByTag = this.bookmarkService.getBookmarksByTag();
      
      Object.entries(bookmarksByTag).forEach(([tagName, bookmarks]) => {
        const groupElement = this.createBookmarkGroup(tagName, bookmarks);
        bookmarkTree.appendChild(groupElement);
      });
    } catch (error) {
      console.error('Failed to render bookmark sidebar:', error);
    }
  }

  /**
   * 북마크 그룹 요소를 생성합니다.
   * 
   * @param {string} tagName 태그명
   * @param {Array} bookmarks 북마크 목록
   * @returns {HTMLElement} 그룹 요소
   */
  createBookmarkGroup(tagName, bookmarks) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'custom_side_bar-root-group';
    
    groupDiv.innerHTML = `
      <div class="custom_side_bar-root-group-top">
        <div class="custom_side_bar-root-group-title">📁 ${tagName}</div>
        <div class="custom_group-delete-button" data-tag="${tagName}">×</div>
      </div>
    `;

    // 북마크 아이템들 추가
    bookmarks.forEach(bookmark => {
      const itemElement = this.createBookmarkItem(bookmark);
      groupDiv.appendChild(itemElement);
    });

    // 그룹 삭제 버튼 이벤트
    const deleteBtn = groupDiv.querySelector('.custom_group-delete-button');
    deleteBtn.addEventListener('click', () => {
      this.removeBookmarkGroup(tagName);
    });

    return groupDiv;
  }

  /**
   * 북마크 아이템 요소를 생성합니다.
   * 
   * @param {Object} bookmark 북마크 데이터
   * @returns {HTMLElement} 아이템 요소
   */
  createBookmarkItem(bookmark) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'custom_side_bar-subcategory';
    
    itemDiv.innerHTML = `
      <span>${bookmark.subTagName}</span>
      <div class="custom_sub-delete-button" data-id="${bookmark.id}">×</div>
    `;

    // 아이템 삭제 버튼 이벤트
    const deleteBtn = itemDiv.querySelector('.custom_sub-delete-button');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeBookmarkItem(bookmark.id);
    });

    return itemDiv;
  }

  /**
   * 북마크 그룹을 제거합니다.
   * 
   * @param {string} tagName 태그명
   */
  async removeBookmarkGroup(tagName) {
    try {
      if (confirm(`"${tagName}" 그룹의 모든 북마크를 삭제하시겠습니까?`)) {
        const removedCount = this.bookmarkService.manageBookmarksUseCase
          .removeBookmarksByCondition({ rootTagName: tagName });
        console.log(`Removed ${removedCount} bookmarks from group ${tagName}`);
      }
    } catch (error) {
      console.error('Failed to remove bookmark group:', error);
    }
  }

  /**
   * 북마크 아이템을 제거합니다.
   * 
   * @param {string} bookmarkId 북마크 ID
   */
  async removeBookmarkItem(bookmarkId) {
    try {
      await this.bookmarkService.removeBookmark(bookmarkId);
    } catch (error) {
      console.error('Failed to remove bookmark item:', error);
    }
  }

  /**
   * 아이템 키를 생성합니다.
   * 
   * @param {Object} item 아이템 데이터
   * @returns {string} 아이템 키
   */
  getItemKey(item) {
    return `${item.rootTagName}_${item.subTagName}_${item.method}_${item.rootPath}_${item.subPath}`;
  }

  /**
   * 키로 서브카테고리를 찾습니다.
   * 
   * @param {string} itemKey 아이템 키
   * @returns {Object|null} 서브카테고리 데이터
   */
  findSubcategoryByKey(itemKey) {
    return this.currentSubcategories.find(sub => this.getItemKey(sub) === itemKey);
  }

  /**
   * 모달 상태를 초기화합니다.
   */
  resetModalState() {
    this.currentCategories = [];
    this.currentSubcategories = [];
    this.selectedItems.clear();
  }

  /**
   * 에러 메시지를 표시합니다.
   * 
   * @param {string} message 에러 메시지
   */
  showError(message) {
    // 간단한 에러 표시 (실제로는 더 정교한 UI 필요)
    console.error(message);
    alert(message);
  }

  /**
   * 컨트롤러를 정리합니다.
   */
  destroy() {
    this.resetModalState();
    console.log('Bookmark controller destroyed');
  }
}