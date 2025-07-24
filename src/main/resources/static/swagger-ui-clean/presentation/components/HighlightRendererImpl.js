import { HighlightRenderer } from '../../application/interfaces/HighlightRenderer.js';

/**
 * API 하이라이트 렌더링 구현체
 */
export class HighlightRendererImpl extends HighlightRenderer {
  constructor() {
    super();
    this.statusClassMap = {
      '작업중': 'status-작업중',
      '작업완료': 'status-작업완료',
      '업데이트': 'status-업데이트',
      '작업안함': 'status-작업안함',
      '테스트중': 'status-테스트중',
      '테스트완료': 'status-테스트완료',
      '테스트실패': 'status-테스트실패',
      '테스트성공': 'status-테스트성공'
    };

    this.badgeClassMap = {
      '작업중': 'badge-작업중',
      '작업완료': 'badge-작업완료',
      '업데이트': 'badge-업데이트',
      '작업안함': 'badge-작업안함',
      '테스트중': 'badge-테스트중',
      '테스트완료': 'badge-테스트완료',
      '테스트실패': 'badge-테스트실패',
      '테스트성공': 'badge-테스트성공'
    };
  }

  /**
   * API 상태에 따른 하이라이트를 적용합니다
   * @param {HTMLElement} block 
   * @param {string} status 
   */
  applyStatusHighlight(block, status) {
    if (!block || !status) return;

    try {
      // 기존 상태 클래스 제거
      this.removeStatusClasses(block);

      // 새로운 상태 클래스 추가
      const statusClass = this.statusClassMap[status];
      if (statusClass) {
        block.classList.add(statusClass);
      }

      // 상태 배지 추가
      this.addStatusBadge(block, status);

    } catch (error) {
      console.error('상태 하이라이트 적용 실패:', error);
    }
  }

  /**
   * 새로운 API 하이라이트를 적용합니다
   * @param {HTMLElement} block 
   */
  applyNewApiHighlight(block) {
    if (!block) return;

    try {
      // 새 API 클래스 추가
      block.classList.add('new-api');

      // 새 API 배지 추가
      this.addNewApiBadge(block);

      // 애니메이션 효과 추가
      this.addGlowEffect(block);

    } catch (error) {
      console.error('새 API 하이라이트 적용 실패:', error);
    }
  }

  /**
   * 북마크 하이라이트를 적용합니다
   * @param {HTMLElement} block 
   */
  applyBookmarkHighlight(block) {
    if (!block) return;

    try {
      // 북마크 클래스 추가
      block.classList.add('bookmarked');

      // 북마크 아이콘 추가
      this.addBookmarkIcon(block);

    } catch (error) {
      console.error('북마크 하이라이트 적용 실패:', error);
    }
  }

  /**
   * 모든 하이라이트를 제거합니다
   * @param {HTMLElement} block 
   */
  removeAllHighlights(block) {
    if (!block) return;

    try {
      // 상태 클래스 제거
      this.removeStatusClasses(block);

      // 기타 하이라이트 클래스 제거
      block.classList.remove('new-api', 'bookmarked');

      // 배지들 제거
      this.removeBadges(block);

      // 추가된 아이콘들 제거
      this.removeAddedIcons(block);

    } catch (error) {
      console.error('하이라이트 제거 실패:', error);
    }
  }

  /**
   * 상태 배지를 추가합니다
   * @param {HTMLElement} block 
   * @param {string} status 
   */
  addStatusBadge(block, status) {
    try {
      // 기존 상태 배지 제거
      this.removeStatusBadge(block);

      const summaryDescription = block.querySelector('.opblock-summary-description');
      if (!summaryDescription) return;

      const badgeClass = this.badgeClassMap[status];
      if (!badgeClass) return;

      const badge = document.createElement('span');
      badge.className = `status-badge ${badgeClass}`;
      badge.textContent = status;
      badge.dataset.statusBadge = 'true';

      summaryDescription.appendChild(badge);

    } catch (error) {
      console.error('상태 배지 추가 실패:', error);
    }
  }

  /**
   * 새 API 배지를 추가합니다
   * @param {HTMLElement} block 
   */
  addNewApiBadge(block) {
    try {
      const summaryDescription = block.querySelector('.opblock-summary-description');
      if (!summaryDescription) return;

      // 이미 새 API 배지가 있는지 확인
      if (summaryDescription.querySelector('[data-new-api-badge]')) return;

      const badge = document.createElement('span');
      badge.className = 'new-api-badge';
      badge.textContent = 'NEW';
      badge.dataset.newApiBadge = 'true';

      summaryDescription.appendChild(badge);

    } catch (error) {
      console.error('새 API 배지 추가 실패:', error);
    }
  }

  /**
   * 북마크 아이콘을 추가합니다
   * @param {HTMLElement} block 
   */
  addBookmarkIcon(block) {
    try {
      const summary = block.querySelector('.opblock-summary');
      if (!summary) return;

      // 이미 북마크 아이콘이 있는지 확인
      if (summary.querySelector('[data-bookmark-icon]')) return;

      const icon = document.createElement('span');
      icon.className = 'bookmark-icon material-symbols-outlined';
      icon.textContent = 'bookmark';
      icon.dataset.bookmarkIcon = 'true';
      icon.title = '북마크된 API';

      // 요약 영역의 시작 부분에 추가
      summary.insertBefore(icon, summary.firstChild);

    } catch (error) {
      console.error('북마크 아이콘 추가 실패:', error);
    }
  }

  /**
   * 글로우 효과를 추가합니다
   * @param {HTMLElement} block 
   */
  addGlowEffect(block) {
    try {
      block.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
      block.style.transition = 'box-shadow 0.3s ease';

      // 5초 후 글로우 효과 제거
      setTimeout(() => {
        if (block.style.boxShadow === '0 0 10px rgba(255, 193, 7, 0.5)') {
          block.style.boxShadow = '';
        }
      }, 5000);

    } catch (error) {
      console.error('글로우 효과 추가 실패:', error);
    }
  }

  /**
   * 상태 클래스들을 제거합니다
   * @param {HTMLElement} block 
   */
  removeStatusClasses(block) {
    Object.values(this.statusClassMap).forEach(className => {
      block.classList.remove(className);
    });
  }

  /**
   * 상태 배지를 제거합니다
   * @param {HTMLElement} block 
   */
  removeStatusBadge(block) {
    const existingBadge = block.querySelector('[data-status-badge]');
    if (existingBadge) {
      existingBadge.remove();
    }
  }

  /**
   * 모든 배지를 제거합니다
   * @param {HTMLElement} block 
   */
  removeBadges(block) {
    // 상태 배지 제거
    this.removeStatusBadge(block);

    // 새 API 배지 제거
    const newApiBadge = block.querySelector('[data-new-api-badge]');
    if (newApiBadge) {
      newApiBadge.remove();
    }
  }

  /**
   * 추가된 아이콘들을 제거합니다
   * @param {HTMLElement} block 
   */
  removeAddedIcons(block) {
    // 북마크 아이콘 제거
    const bookmarkIcon = block.querySelector('[data-bookmark-icon]');
    if (bookmarkIcon) {
      bookmarkIcon.remove();
    }
  }

  /**
   * 블록에서 API 정보를 추출합니다
   * @param {HTMLElement} block 
   * @returns {Object}
   */
  extractApiInfo(block) {
    try {
      const pathElement = block.querySelector('.opblock-summary-path');
      const methodElement = block.querySelector('.opblock-summary-method');
      const summaryElement = block.querySelector('.opblock-summary-description');

      return {
        path: pathElement ? pathElement.textContent.trim() : '',
        method: methodElement ? methodElement.textContent.trim() : '',
        summary: summaryElement ? summaryElement.textContent.trim() : ''
      };
    } catch (error) {
      console.error('API 정보 추출 실패:', error);
      return {
        path: '',
        method: '',
        summary: ''
      };
    }
  }

  /**
   * 하이라이트 상태를 확인합니다
   * @param {HTMLElement} block 
   * @returns {Object}
   */
  getHighlightStatus(block) {
    const status = {
      hasStatusHighlight: false,
      hasNewApiHighlight: false,
      hasBookmarkHighlight: false,
      currentStatus: null
    };

    try {
      // 상태 하이라이트 확인
      Object.entries(this.statusClassMap).forEach(([statusName, className]) => {
        if (block.classList.contains(className)) {
          status.hasStatusHighlight = true;
          status.currentStatus = statusName;
        }
      });

      // 새 API 하이라이트 확인
      status.hasNewApiHighlight = block.classList.contains('new-api');

      // 북마크 하이라이트 확인
      status.hasBookmarkHighlight = block.classList.contains('bookmarked');

    } catch (error) {
      console.error('하이라이트 상태 확인 실패:', error);
    }

    return status;
  }
}