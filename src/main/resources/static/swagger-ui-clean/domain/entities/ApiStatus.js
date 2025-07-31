/**
 * API 상태 엔터티
 * API의 작업 상태를 관리하는 도메인 엔터티입니다.
 */
export class ApiStatus {
  static STATUS_TYPES = {
    COMPLETED: '✅',        // 작업완료
    NOT_WORKING: '⛔',      // 작업안함
    TEST_SUCCESS: '🎉',     // 테스트성공
    TEST_FAILED: '❌',      // 테스트실패
    TEST_COMPLETED: '🟩',   // 테스트완료
    TESTING: '🪪',          // 테스트중
    WORKING: '🔧',          // 작업중
    UPDATED: '⬆️'           // 업데이트
  };

  static STATUS_NAMES = {
    [ApiStatus.STATUS_TYPES.COMPLETED]: '작업완료',
    [ApiStatus.STATUS_TYPES.NOT_WORKING]: '작업안함',
    [ApiStatus.STATUS_TYPES.TEST_SUCCESS]: '테스트성공',
    [ApiStatus.STATUS_TYPES.TEST_FAILED]: '테스트실패',
    [ApiStatus.STATUS_TYPES.TEST_COMPLETED]: '테스트완료',
    [ApiStatus.STATUS_TYPES.TESTING]: '테스트중',
    [ApiStatus.STATUS_TYPES.WORKING]: '작업중',
    [ApiStatus.STATUS_TYPES.UPDATED]: '업데이트'
  };

  constructor(status) {
    this.validateStatus(status);
    this.status = status;
  }

  /**
   * 상태 유효성 검증
   */
  validateStatus(status) {
    const validStatuses = Object.values(ApiStatus.STATUS_TYPES);
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * 현재 상태 반환
   */
  getStatus() {
    return this.status;
  }

  /**
   * 상태 이름 반환
   */
  getStatusName() {
    return ApiStatus.STATUS_NAMES[this.status];
  }

  /**
   * 상태 변경
   */
  setStatus(newStatus) {
    this.validateStatus(newStatus);
    this.status = newStatus;
  }

  /**
   * 작업 완료 상태인지 확인
   */
  isCompleted() {
    return this.status === ApiStatus.STATUS_TYPES.COMPLETED;
  }

  /**
   * 작업 중 상태인지 확인
   */
  isWorking() {
    return this.status === ApiStatus.STATUS_TYPES.WORKING;
  }

  /**
   * 테스트 관련 상태인지 확인
   */
  isTestingRelated() {
    return [
      ApiStatus.STATUS_TYPES.TEST_SUCCESS,
      ApiStatus.STATUS_TYPES.TEST_FAILED,
      ApiStatus.STATUS_TYPES.TEST_COMPLETED,
      ApiStatus.STATUS_TYPES.TESTING
    ].includes(this.status);
  }

  /**
   * 긍정적인 상태인지 확인 (완료, 성공 등)
   */
  isPositive() {
    return [
      ApiStatus.STATUS_TYPES.COMPLETED,
      ApiStatus.STATUS_TYPES.TEST_SUCCESS,
      ApiStatus.STATUS_TYPES.TEST_COMPLETED,
      ApiStatus.STATUS_TYPES.UPDATED
    ].includes(this.status);
  }

  /**
   * CSS 클래스명 반환
   */
  getCssClass() {
    const statusMap = {
      [ApiStatus.STATUS_TYPES.COMPLETED]: 'status-작업완료',
      [ApiStatus.STATUS_TYPES.NOT_WORKING]: 'status-작업안함',
      [ApiStatus.STATUS_TYPES.TEST_SUCCESS]: 'status-테스트성공',
      [ApiStatus.STATUS_TYPES.TEST_FAILED]: 'status-테스트실패',
      [ApiStatus.STATUS_TYPES.TEST_COMPLETED]: 'status-테스트완료',
      [ApiStatus.STATUS_TYPES.TESTING]: 'status-테스트중',
      [ApiStatus.STATUS_TYPES.WORKING]: 'status-작업중',
      [ApiStatus.STATUS_TYPES.UPDATED]: 'status-업데이트'
    };
    return statusMap[this.status] || '';
  }

  /**
   * 배지 CSS 클래스명 반환
   */
  getBadgeClass() {
    return `badge-${this.getStatusName()}`;
  }

  /**
   * JSON으로 직렬화
   */
  toJSON() {
    return {
      status: this.status,
      statusName: this.getStatusName()
    };
  }

  /**
   * JSON에서 ApiStatus 인스턴스 생성
   */
  static fromJSON(json) {
    return new ApiStatus(json.status);
  }

  /**
   * 모든 가능한 상태 반환
   */
  static getAllStatuses() {
    return Object.values(ApiStatus.STATUS_TYPES);
  }

  /**
   * 상태별 통계 생성
   */
  static createStatusStats(statusList) {
    const stats = {};
    Object.values(ApiStatus.STATUS_TYPES).forEach(status => {
      stats[status] = 0;
    });

    statusList.forEach(status => {
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    return stats;
  }
}