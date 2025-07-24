import { ModalState } from '../../domain/entities/ModalState.js';

/**
 * 모달 상태 저장소
 */
export class ModalStateRepository {
  constructor(storageRepository) {
    this.storageRepository = storageRepository;
    this.MODAL_STATE_KEY = 'swagger_modal_state';
    this.currentState = new ModalState();
  }

  /**
   * 모달 상태를 가져옵니다
   * @returns {Promise<ModalState>}
   */
  async getModalState() {
    try {
      const stateData = this.storageRepository.getJsonItem(this.MODAL_STATE_KEY);
      
      if (stateData) {
        const modalState = new ModalState();
        modalState.isOpen = stateData.isOpen || false;
        modalState.selectedCategory = stateData.selectedCategory || null;
        modalState.categories = stateData.categories || [];
        modalState.subcategories = stateData.subcategories || [];
        
        // Set을 복원
        if (stateData.selectedSubcategories && Array.isArray(stateData.selectedSubcategories)) {
          modalState.selectedSubcategories = new Set(stateData.selectedSubcategories);
        }
        
        this.currentState = modalState;
        return modalState;
      }
      
      return this.currentState;
    } catch (error) {
      console.error('모달 상태 로드 실패:', error);
      return this.currentState;
    }
  }

  /**
   * 모달 상태를 저장합니다
   * @param {ModalState} modalState 
   * @returns {Promise<void>}
   */
  async saveModalState(modalState) {
    try {
      const stateData = {
        isOpen: modalState.isOpen,
        selectedCategory: modalState.selectedCategory,
        categories: modalState.categories,
        subcategories: modalState.subcategories,
        selectedSubcategories: Array.from(modalState.selectedSubcategories)
      };
      
      this.storageRepository.setJsonItem(this.MODAL_STATE_KEY, stateData);
      this.currentState = modalState;
    } catch (error) {
      console.error('모달 상태 저장 실패:', error);
    }
  }

  /**
   * 모달 상태를 초기화합니다
   * @returns {Promise<void>}
   */
  async resetModalState() {
    try {
      this.storageRepository.removeItem(this.MODAL_STATE_KEY);
      this.currentState = new ModalState();
    } catch (error) {
      console.error('모달 상태 초기화 실패:', error);
    }
  }

  /**
   * 현재 변환된 스펙을 가져옵니다 (임시 저장용)
   * @returns {Object}
   */
  getConvertSpec() {
    try {
      return this.storageRepository.getJsonItem('swagger_convert_spec', {});
    } catch (error) {
      console.error('변환 스펙 로드 실패:', error);
      return {};
    }
  }

  /**
   * 변환된 스펙을 저장합니다 (임시 저장용)
   * @param {Object} spec 
   */
  setConvertSpec(spec) {
    try {
      this.storageRepository.setJsonItem('swagger_convert_spec', spec);
    } catch (error) {
      console.error('변환 스펙 저장 실패:', error);
    }
  }
}