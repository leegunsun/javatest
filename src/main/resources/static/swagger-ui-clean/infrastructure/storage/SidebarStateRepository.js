import { SidebarState } from '../../domain/entities/SidebarState.js';

/**
 * 사이드바 상태 저장소
 */
export class SidebarStateRepository {
  constructor(storageRepository) {
    this.storageRepository = storageRepository;
    this.SIDEBAR_STATE_KEY = 'swagger_sidebar_state';
  }

  /**
   * 사이드바 상태를 가져옵니다
   * @returns {Promise<SidebarState>}
   */
  async getSidebarState() {
    try {
      const stateData = this.storageRepository.getJsonItem(this.SIDEBAR_STATE_KEY);
      
      if (stateData) {
        return new SidebarState(stateData.isCollapsed);
      }
      
      return new SidebarState();
    } catch (error) {
      console.error('사이드바 상태 로드 실패:', error);
      return new SidebarState();
    }
  }

  /**
   * 사이드바 상태를 저장합니다
   * @param {SidebarState} sidebarState 
   * @returns {Promise<void>}
   */
  async saveSidebarState(sidebarState) {
    try {
      const stateData = {
        isCollapsed: sidebarState.isCollapsed
      };
      
      this.storageRepository.setJsonItem(this.SIDEBAR_STATE_KEY, stateData);
    } catch (error) {
      console.error('사이드바 상태 저장 실패:', error);
    }
  }

  /**
   * 사이드바 상태를 초기화합니다
   * @returns {Promise<void>}
   */
  async resetSidebarState() {
    try {
      this.storageRepository.removeItem(this.SIDEBAR_STATE_KEY);
    } catch (error) {
      console.error('사이드바 상태 초기화 실패:', error);
    }
  }
}