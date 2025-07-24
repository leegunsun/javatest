/**
 * 모달 상태를 나타내는 도메인 엔티티
 */
export class ModalState {
  constructor() {
    this.isOpen = false;
    this.selectedCategory = null;
    this.selectedSubcategories = new Set();
    this.categories = [];
    this.subcategories = [];
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    this.reset();
  }

  reset() {
    this.selectedCategory = null;
    this.selectedSubcategories.clear();
    this.subcategories = [];
  }

  setCategories(categories) {
    this.categories = categories;
  }

  selectCategory(category) {
    this.selectedCategory = category;
    this.subcategories = category.subcategories || [];
  }

  toggleSubcategory(subcategory) {
    if (this.selectedSubcategories.has(subcategory)) {
      this.selectedSubcategories.delete(subcategory);
    } else {
      this.selectedSubcategories.add(subcategory);
    }
  }

  getSelectedSubcategoriesArray() {
    return Array.from(this.selectedSubcategories);
  }

  hasSelectedSubcategories() {
    return this.selectedSubcategories.size > 0;
  }
}