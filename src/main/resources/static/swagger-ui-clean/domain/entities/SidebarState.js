/**
 * 사이드바 상태를 나타내는 도메인 엔티티
 */
export class SidebarState {
  constructor(isCollapsed = false) {
    this.isCollapsed = isCollapsed;
  }

  toggle() {
    this.isCollapsed = !this.isCollapsed;
    return this.isCollapsed;
  }

  collapse() {
    this.isCollapsed = true;
  }

  expand() {
    this.isCollapsed = false;
  }

  getToggleButtonText() {
    return this.isCollapsed ? "☰" : "←";
  }

  getCssClasses() {
    return {
      sidebar: this.isCollapsed ? "collapsed" : "",
      swaggerUi: this.isCollapsed ? "sidebar-collapsed" : ""
    };
  }
}