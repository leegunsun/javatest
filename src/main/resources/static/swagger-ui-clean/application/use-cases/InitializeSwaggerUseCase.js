/**
 * Swagger UI 초기화 유스케이스
 */
export class InitializeSwaggerUseCase {
  constructor(
    swaggerRepository,
    apiStatusRepository,
    sidebarService,
    highlightService
  ) {
    this.swaggerRepository = swaggerRepository;
    this.apiStatusRepository = apiStatusRepository;
    this.sidebarService = sidebarService;
    this.highlightService = highlightService;
  }

  /**
   * Swagger UI를 초기화합니다
   * @param {string} groupName - 그룹명 (null인 경우 커스텀 API)
   * @returns {Promise<Object>} Swagger UI 인스턴스
   */
  async execute(groupName = null) {
    try {
      // 1. API 데이터 로드
      const { statusMap, createdMap, groupedList } = await this.apiStatusRepository.fetchAllData();
      
      // 2. Swagger 스펙 로드
      const spec = groupName 
        ? await this.swaggerRepository.getSwaggerSpec(groupName)
        : await this.swaggerRepository.getFilteredSwaggerSpec();

      // 3. Swagger UI 생성
      const ui = this.createSwaggerUI(spec);

      // 4. 초기화 완료 후 추가 작업
      this.setupPostInitializationTasks();

      return {
        ui,
        statusMap,
        createdMap,
        groupedList
      };
    } catch (error) {
      console.error('Swagger UI 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * Swagger UI 인스턴스를 생성합니다
   * @param {Object} spec 
   * @returns {Object}
   */
  createSwaggerUI(spec) {
    return SwaggerUIBundle({
      spec,
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      defaultModelsExpandDepth: 0,
      onComplete: () => {
        setTimeout(() => {
          this.onSwaggerUIComplete();
        }, 1000);
      },
    });
  }

  /**
   * Swagger UI 로드 완료 후 실행되는 작업들
   */
  onSwaggerUIComplete() {
    // 드롭다운 버튼 초기화
    this.initializeDropdownButton();
    
    // 모든 하이라이트 적용
    this.highlightService.highlightAll();
    
    // API 설명에 접두사 추가
    this.addApiPrefixToDescription();
  }

  /**
   * 드롭다운 버튼을 초기화합니다
   */
  initializeDropdownButton() {
    // 구현 필요
  }

  /**
   * API 설명에 접두사를 추가합니다
   */
  addApiPrefixToDescription() {
    // 구현 필요
  }

  /**
   * 초기화 후 작업들을 설정합니다
   */
  setupPostInitializationTasks() {
    // 전역 변수 설정
    window.ui = null; // UI 인스턴스는 반환값으로 처리
    
    // 이벤트 리스너 등록
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너들을 설정합니다
   */
  setupEventListeners() {
    // 페이지 새로고침 버튼
    document.getElementById('refresh-page-btn')?.addEventListener('click', () => {
      window.location.reload();
    });

    // 로컬스토리지 초기화 버튼
    document.getElementById('reset-localstorage-btn')?.addEventListener('click', () => {
      localStorage.clear();
      alert('LocalStorage가 초기화되었습니다.');
    });

    // 쿠키 초기화 버튼
    document.getElementById('reset-cookie-btn')?.addEventListener('click', () => {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
      alert('쿠키가 초기화되었습니다.');
    });
  }
}