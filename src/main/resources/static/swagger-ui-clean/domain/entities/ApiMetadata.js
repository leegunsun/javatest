/**
 * API 메타데이터 엔터티
 * 도메인 계층의 핵심 엔터티로서 API의 메타 정보를 캡슐화합니다.
 */
export class ApiMetadata {
  constructor(controllerName, tag, methods = {}) {
    this.controllerName = controllerName;
    this.tag = tag;
    this.methods = methods;
  }

  /**
   * 컨트롤러 이름 반환
   */
  getControllerName() {
    return this.controllerName;
  }

  /**
   * 태그 정보 반환
   */
  getTag() {
    return this.tag;
  }

  /**
   * 특정 메서드 정보 반환
   */
  getMethodInfo(methodName) {
    return this.methods[methodName];
  }

  /**
   * 모든 메서드 반환
   */
  getAllMethods() {
    return this.methods;
  }

  /**
   * 메서드 추가
   */
  addMethod(methodName, methodInfo) {
    this.methods[methodName] = methodInfo;
  }

  /**
   * 특정 메서드의 작성자 반환
   */
  getMethodAuthor(methodName) {
    return this.methods[methodName]?.author;
  }

  /**
   * 특정 메서드의 작성일 반환
   */
  getMethodDate(methodName) {
    return this.methods[methodName]?.date;
  }

  /**
   * 메서드가 특정 날짜 이후에 생성되었는지 확인
   */
  isMethodCreatedAfter(methodName, date) {
    const methodDate = this.getMethodDate(methodName);
    if (!methodDate) return false;
    return new Date(methodDate) > new Date(date);
  }

  /**
   * 유효성 검증
   */
  isValid() {
    return this.controllerName && this.tag && 
           this.tag.name && this.tag.description;
  }

  /**
   * JSON으로 직렬화
   */
  toJSON() {
    return {
      controllerName: this.controllerName,
      tag: this.tag,
      methods: this.methods
    };
  }

  /**
   * JSON에서 ApiMetadata 인스턴스 생성
   */
  static fromJSON(json) {
    return new ApiMetadata(
      json.controllerName,
      json.tag,
      json.methods
    );
  }
}