/**
 * API 그룹을 나타내는 도메인 엔티티
 */
export class ApiGroup {
  constructor(name, description, apis = []) {
    this.name = name;
    this.description = description;
    this.apis = apis;
  }

  addApi(api) {
    this.apis.push(api);
  }

  removeApi(apiPath) {
    this.apis = this.apis.filter(api => api.path !== apiPath);
  }

  getApiCount() {
    return this.apis.length;
  }

  getNewApiCount() {
    return this.apis.filter(api => api.isNew).length;
  }

  hasApis() {
    return this.apis.length > 0;
  }
}