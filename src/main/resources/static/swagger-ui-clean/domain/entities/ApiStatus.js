/**
 * API 상태를 나타내는 도메인 엔티티
 */
export class ApiStatus {
  constructor(path, status, createdDate) {
    this.path = path;
    this.status = status;
    this.createdDate = createdDate;
  }

  isWorking() {
    return this.status === '작업중';
  }

  isCompleted() {
    return this.status === '작업완료';
  }

  isUpdated() {
    return this.status === '업데이트';
  }

  isTesting() {
    return this.status === '테스트중';
  }

  isTestCompleted() {
    return this.status === '테스트완료';
  }

  isTestFailed() {
    return this.status === '테스트실패';
  }

  isTestSuccess() {
    return this.status === '테스트성공';
  }

  isNotWorking() {
    return this.status === '작업안함';
  }

  getStatusClass() {
    return `status-${this.status}`;
  }

  getBadgeClass() {
    return `badge-${this.status}`;
  }
}