/**
 * API 엔드포인트를 나타내는 도메인 엔티티
 */
export class ApiEndpoint {
  constructor(path, method, tag, summary, description, isNew = false) {
    this.path = path;
    this.method = method.toUpperCase();
    this.tag = tag;
    this.summary = summary;
    this.description = description;
    this.isNew = isNew;
    this.isBookmarked = false;
  }

  getMethodClass() {
    return `opblock-${this.method.toLowerCase()}`;
  }

  getFullPath() {
    return `${this.method} ${this.path}`;
  }

  toggleBookmark() {
    this.isBookmarked = !this.isBookmarked;
    return this.isBookmarked;
  }

  setBookmark(isBookmarked) {
    this.isBookmarked = isBookmarked;
  }

  equals(other) {
    return this.path === other.path && this.method === other.method;
  }
}