import { ModalRenderer } from '../../application/interfaces/ModalRenderer.js';

/**
 * 모달 렌더링 구현체
 */
export class ModalRendererImpl extends ModalRenderer {
  constructor() {
    super();
    this.currentCategories = [];
    this.currentSubcategories = [];
  }

  /**
   * 카테고리 리스트를 렌더링합니다
   * @param {Array} bookmarkedApis 
   */
  renderCategoryList(bookmarkedApis) {
    const categoryListContainer = document.getElementById('category-list');
    if (!categoryListContainer) return;

    this.clearContainer(categoryListContainer);

    // 전체 API 스펙에서 카테고리 추출
    const categories = this.extractCategoriesFromSpec();
    this.currentCategories = categories;

    if (categories.length === 0) {
      this.renderEmptyCategories(categoryListContainer);
      return;
    }

    categories.forEach(category => {
      const categoryElement = this.createCategoryElement(category, bookmarkedApis);
      categoryListContainer.appendChild(categoryElement);
    });
  }

  /**
   * 스펙에서 카테고리를 추출합니다
   * @returns {Array}
   */
  extractCategoriesFromSpec() {
    try {
      // 전역 스펙 데이터에서 태그 추출
      const spec = window.swaggerSpec || {};
      const tags = spec.tags || [];
      
      return tags.map(tag => ({
        name: tag.name,
        description: tag.description || '',
        subcategories: this.extractSubcategoriesForTag(tag.name, spec)
      }));
    } catch (error) {
      console.error('카테고리 추출 실패:', error);
      return [];
    }
  }

  /**
   * 특정 태그의 서브카테고리를 추출합니다
   * @param {string} tagName 
   * @param {Object} spec 
   * @returns {Array}
   */
  extractSubcategoriesForTag(tagName, spec) {
    const subcategories = [];
    
    if (!spec.paths) return subcategories;

    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        if (operation.tags && operation.tags.includes(tagName)) {
          subcategories.push({
            id: `${method.toUpperCase()} ${path}`,
            path: path,
            method: method.toUpperCase(),
            summary: operation.summary || '',
            description: operation.description || '',
            tag: tagName
          });
        }
      });
    });

    return subcategories;
  }

  /**
   * 카테고리 요소를 생성합니다
   * @param {Object} category 
   * @param {Array} bookmarkedApis 
   * @returns {HTMLElement}
   */
  createCategoryElement(category, bookmarkedApis) {
    const div = document.createElement('div');
    div.className = 'selectCategory';
    div.dataset.categoryName = category.name;

    // 북마크된 API가 있는 카테고리는 활성화 표시
    const hasBookmarkedApis = category.subcategories.some(sub => 
      bookmarkedApis.includes(sub.id) || bookmarkedApis.includes(sub.path)
    );

    if (hasBookmarkedApis) {
      div.classList.add('selectCategory-active');
    }

    div.innerHTML = `
      <div class="category-header">
        <span class="category-name">${category.name}</span>
        <span class="category-count">(${category.subcategories.length})</span>
      </div>
      ${category.description ? `<div class="category-description">${category.description}</div>` : ''}
    `;

    // 클릭 이벤트 추가
    div.addEventListener('click', () => {
      this.handleCategoryClick(category, div);
    });

    return div;
  }

  /**
   * 카테고리 클릭 핸들러
   * @param {Object} category 
   * @param {HTMLElement} element 
   */
  handleCategoryClick(category, element) {
    // 다른 카테고리 비활성화
    document.querySelectorAll('.selectCategory').forEach(cat => {
      cat.classList.remove('selected');
    });

    // 현재 카테고리 활성화
    element.classList.add('selected');

    // 서브카테고리 렌더링
    this.renderSubcategories(category.subcategories);
  }

  /**
   * 서브카테고리들을 렌더링합니다
   * @param {Array} subcategories 
   */
  renderSubcategories(subcategories) {
    const subcategoryContainer = document.getElementById('subcategory-list');
    if (!subcategoryContainer) return;

    this.clearContainer(subcategoryContainer);
    this.currentSubcategories = subcategories;

    if (subcategories.length === 0) {
      this.renderEmptySubcategories(subcategoryContainer);
      return;
    }

    subcategories.forEach(subcategory => {
      const subcategoryElement = this.createSubcategoryElement(subcategory);
      subcategoryContainer.appendChild(subcategoryElement);
    });
  }

  /**
   * 서브카테고리 요소를 생성합니다
   * @param {Object} subcategory 
   * @returns {HTMLElement}
   */
  createSubcategoryElement(subcategory) {
    const div = document.createElement('div');
    div.className = 'subcategory-item';
    div.dataset.subcategoryId = subcategory.id;

    const methodClass = `method-${subcategory.method.toLowerCase()}`;
    
    div.innerHTML = `
      <div class="subcategory-header">
        <span class="method-badge ${methodClass}">${subcategory.method}</span>
        <span class="subcategory-path">${subcategory.path}</span>
      </div>
      ${subcategory.summary ? `<div class="subcategory-summary">${subcategory.summary}</div>` : ''}
    `;

    // 클릭 이벤트 추가
    div.addEventListener('click', () => {
      this.handleSubcategoryClick(subcategory, div);
    });

    return div;
  }

  /**
   * 서브카테고리 클릭 핸들러
   * @param {Object} subcategory 
   * @param {HTMLElement} element 
   */
  handleSubcategoryClick(subcategory, element) {
    element.classList.toggle('selected');
    
    // 선택된 항목들 업데이트
    this.updateSelectedItems();
  }

  /**
   * 선택된 항목들을 업데이트합니다
   */
  updateSelectedItems() {
    const selectedElements = document.querySelectorAll('.subcategory-item.selected');
    const selectedItems = Array.from(selectedElements).map(el => {
      const id = el.dataset.subcategoryId;
      return this.currentSubcategories.find(sub => sub.id === id);
    }).filter(Boolean);

    this.renderSelectedItems(selectedItems);
  }

  /**
   * 선택된 항목들을 렌더링합니다
   * @param {Array} selectedItems 
   */
  renderSelectedItems(selectedItems) {
    const selectedContainer = document.getElementById('selected-subcategories');
    if (!selectedContainer) return;

    this.clearContainer(selectedContainer);

    if (selectedItems.length === 0) {
      this.renderEmptySelection(selectedContainer);
      return;
    }

    const header = document.createElement('div');
    header.className = 'selected-header';
    header.textContent = `선택된 항목 (${selectedItems.length}개)`;
    selectedContainer.appendChild(header);

    selectedItems.forEach(item => {
      const itemElement = this.createSelectedItemElement(item);
      selectedContainer.appendChild(itemElement);
    });
  }

  /**
   * 선택된 항목 요소를 생성합니다
   * @param {Object} item 
   * @returns {HTMLElement}
   */
  createSelectedItemElement(item) {
    const div = document.createElement('div');
    div.className = 'selected-item';
    div.dataset.itemId = item.id;

    const methodClass = `method-${item.method.toLowerCase()}`;

    div.innerHTML = `
      <div class="selected-item-content">
        <span class="method-badge ${methodClass}">${item.method}</span>
        <span class="selected-item-path">${item.path}</span>
        <button class="remove-button" title="제거">×</button>
      </div>
      ${item.summary ? `<div class="selected-item-summary">${item.summary}</div>` : ''}
    `;

    // 제거 버튼 이벤트
    const removeButton = div.querySelector('.remove-button');
    removeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleRemoveSelectedItem(item.id);
    });

    return div;
  }

  /**
   * 선택된 항목 제거 핸들러
   * @param {string} itemId 
   */
  handleRemoveSelectedItem(itemId) {
    // 서브카테고리에서 선택 해제
    const subcategoryElement = document.querySelector(`[data-subcategory-id="${itemId}"]`);
    if (subcategoryElement) {
      subcategoryElement.classList.remove('selected');
    }

    // 선택된 항목들 업데이트
    this.updateSelectedItems();
  }

  /**
   * 컨테이너를 초기화합니다
   * @param {HTMLElement} container 
   */
  clearContainer(container) {
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * 빈 카테고리 상태를 렌더링합니다
   * @param {HTMLElement} container 
   */
  renderEmptyCategories(container) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <div class="empty-icon">📂</div>
      <div class="empty-text">사용 가능한 카테고리가 없습니다</div>
    `;
    container.appendChild(emptyDiv);
  }

  /**
   * 빈 서브카테고리 상태를 렌더링합니다
   * @param {HTMLElement} container 
   */
  renderEmptySubcategories(container) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <div class="empty-icon">📄</div>
      <div class="empty-text">이 카테고리에는 API가 없습니다</div>
    `;
    container.appendChild(emptyDiv);
  }

  /**
   * 빈 선택 상태를 렌더링합니다
   * @param {HTMLElement} container 
   */
  renderEmptySelection(container) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-selection';
    emptyDiv.innerHTML = `
      <div class="empty-icon">☐</div>
      <div class="empty-text">선택된 항목이 없습니다</div>
    `;
    container.appendChild(emptyDiv);
  }

  /**
   * 모달을 초기화합니다
   */
  clear() {
    this.clearContainer(document.getElementById('category-list'));
    this.clearContainer(document.getElementById('subcategory-list'));
    this.clearContainer(document.getElementById('selected-subcategories'));
    
    this.currentCategories = [];
    this.currentSubcategories = [];
  }
}