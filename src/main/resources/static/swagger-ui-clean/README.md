# Swagger UI Clean Architecture

클린 아키텍처 원칙을 적용하여 리팩토링된 커스텀 스웨거 UI 애플리케이션입니다.

## 📁 프로젝트 구조

```
swagger-ui-clean/
├── domain/                          # 도메인 계층
│   ├── entities/                    # 엔터티
│   │   ├── ApiMetadata.js          # API 메타데이터 엔터티
│   │   ├── ApiStatus.js            # API 상태 엔터티
│   │   └── SwaggerSpec.js          # 스웨거 스펙 엔터티
│   └── usecases/                   # 유스케이스
│       ├── GetApiData.js           # API 데이터 조회 유스케이스
│       ├── FilterApiSpec.js        # API 스펙 필터링 유스케이스
│       └── ManageBookmarks.js      # 북마크 관리 유스케이스
├── infrastructure/                  # 인프라스트럭처 계층
│   ├── api/                        # 외부 API
│   │   └── SwaggerApiClient.js     # 스웨거 API 클라이언트
│   └── storage/                    # 저장소
│       ├── LocalStorageAdapter.js  # 로컬 스토리지 어댑터
│       └── BookmarkRepository.js   # 북마크 저장소
├── application/                     # 애플리케이션 계층
│   ├── services/                   # 서비스
│   │   ├── ApiDataService.js       # API 데이터 서비스
│   │   ├── SwaggerUIService.js     # 스웨거 UI 서비스
│   │   └── BookmarkService.js      # 북마크 서비스
│   └── observers/                  # 옵저버
│       └── SwaggerObserver.js      # 스웨거 변경 감지 옵저버
├── presentation/                    # 프레젠테이션 계층
│   ├── controllers/                # 컨트롤러
│   │   ├── SwaggerController.js    # 메인 스웨거 컨트롤러
│   │   └── BookmarkController.js   # 북마크 컨트롤러
│   ├── views/                      # 뷰 (미구현)
│   └── components/                 # 컴포넌트 (미구현)
├── shared/                         # 공유 계층
│   ├── constants/                  # 상수
│   │   └── ApiConstants.js         # API 관련 상수
│   ├── utils/                      # 유틸리티
│   │   └── DomUtils.js            # DOM 조작 유틸리티
│   └── config/                     # 설정
│       └── AppConfig.js           # 애플리케이션 설정
├── main.js                         # 애플리케이션 진입점
├── index.html                      # HTML 진입점
└── README.md                       # 프로젝트 문서
```

## 🏗️ 아키텍처 개요

### 클린 아키텍처 계층

1. **도메인 계층 (Domain Layer)**
   - 비즈니스 로직과 규칙을 담당
   - 외부 의존성이 없는 순수한 비즈니스 로직
   - 엔터티와 유스케이스로 구성

2. **애플리케이션 계층 (Application Layer)**
   - 도메인 유스케이스를 조율
   - 외부 시스템과의 상호작용 관리
   - 서비스와 옵저버로 구성

3. **인프라스트럭처 계층 (Infrastructure Layer)**
   - 외부 시스템과의 실제 연결
   - 데이터 저장소, API 클라이언트 등
   - 구체적인 구현 세부사항

4. **프레젠테이션 계층 (Presentation Layer)**
   - 사용자 인터페이스 담당
   - 사용자 입력 처리 및 화면 표시
   - 컨트롤러, 뷰, 컴포넌트로 구성

5. **공유 계층 (Shared Layer)**
   - 모든 계층에서 공통으로 사용되는 요소
   - 상수, 유틸리티, 설정 등

### 의존성 방향

```
Presentation → Application → Domain ← Infrastructure
                ↑                        ↑
            Shared ←────────────────────┘
```

- 의존성은 항상 내부(도메인) 방향으로 향함
- 도메인 계층은 다른 계층에 의존하지 않음
- 인프라스트럭처 계층은 도메인 계층에만 의존

## 🚀 주요 기능

### 기존 기능 유지
- ✅ API 상태 표시 및 하이라이팅
- ✅ 새로운 API 카운터
- ✅ 북마크 시스템
- ✅ 사이드바 토글
- ✅ 모달 기반 북마크 관리
- ✅ 로컬 스토리지 기반 설정 저장
- ✅ 서버 드롭다운 상태 유지

### 새로운 기능
- 🆕 클린 아키텍처 기반 코드 구조
- 🆕 의존성 주입 시스템
- 🆕 통합된 설정 관리
- 🆕 체계적인 에러 처리
- 🆕 성능 모니터링
- 🆕 개발자 도구 지원

## 💻 기술 스택

- **언어**: JavaScript (ES6+)
- **모듈 시스템**: ES Modules
- **아키텍처**: Clean Architecture
- **디자인 패턴**: 
  - Repository Pattern
  - Observer Pattern
  - Dependency Injection
  - Factory Pattern
- **외부 라이브러리**:
  - Swagger UI Bundle
  - Material Symbols (Icons)

## 🛠️ 개발 가이드

### 새로운 기능 추가 시 주의사항

1. **계층별 역할 준수**
   - 각 계층의 책임을 명확히 구분
   - 의존성 방향 규칙 준수

2. **도메인 우선 개발**
   - 새로운 기능은 도메인 계층부터 설계
   - 비즈니스 로직을 먼저 구현

3. **인터페이스 활용**
   - 추상화를 통한 의존성 역전
   - 테스트 가능한 코드 작성

### 코드 컨벤션

1. **파일 명명 규칙**
   - PascalCase: 클래스 파일 (예: `ApiDataService.js`)
   - camelCase: 유틸리티 함수 (예: `domUtils.js`)

2. **클래스 구조**
   - 생성자에서 의존성 주입
   - public 메서드 먼저, private 메서드 나중에
   - JSDoc 주석으로 문서화

3. **에러 처리**
   - 각 계층에서 appropriate한 에러 처리
   - 사용자 친화적인 에러 메시지

### 테스트 가이드

1. **단위 테스트**
   - 각 계층별로 독립적인 테스트
   - Mock을 활용한 의존성 격리

2. **통합 테스트**
   - 컨트롤러 레벨에서의 통합 테스트
   - 실제 시나리오 기반 테스트

## 🔧 설정 및 설치

### 브라우저 요구사항
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 개발 환경 설정

1. **로컬 서버 실행**
   ```bash
   # 간단한 HTTP 서버 실행 (Python 3)
   python -m http.server 8000
   
   # 또는 Node.js http-server
   npx http-server -p 8000
   ```

2. **브라우저에서 접근**
   ```
   http://localhost:8000/swagger-ui-clean/
   ```

## 🐛 디버깅

### 개발자 도구 활용

```javascript
// 브라우저 콘솔에서 애플리케이션 상태 확인
window.SwaggerApp.getStatus()

// 컴포넌트 직접 접근
window.SwaggerApp.components.apiDataService

// 설정 확인
window.SwaggerApp.components.appConfig.getSummary()
```

### 로그 레벨 설정

```javascript
// 설정을 통한 로그 레벨 변경
window.SwaggerApp.components.appConfig.set('developer.logLevel', 'debug')
```

## 📈 성능 최적화

### 캐싱 전략
- API 데이터: 5분 캐싱
- 설정 데이터: 로컬 스토리지 영구 저장
- UI 상태: 세션 기반 임시 저장

### 지연 로딩
- 모달 콘텐츠 지연 로딩
- 대용량 API 스펙 청크 단위 로딩

## 🔒 보안 고려사항

1. **XSS 방지**
   - innerHTML 사용 시 새니타이징
   - 사용자 입력 검증

2. **데이터 검증**
   - API 응답 데이터 유효성 검증
   - 로컬 스토리지 데이터 검증

## 🚀 배포 가이드

### 프로덕션 빌드
1. 개발자 도구 비활성화
2. 로그 레벨을 'error'로 설정
3. 성능 모니터링 활성화

### 환경별 설정
- Development: 디버그 모드 활성화
- Production: 최적화 및 모니터링 활성화
- Test: 테스트 전용 설정

## 📚 참고 자료

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [JavaScript Clean Code Guidelines](https://github.com/ryanmcdermott/clean-code-javascript)

## 🤝 기여 가이드

1. **이슈 생성**: 버그 리포트나 기능 요청
2. **브랜치 생성**: `feature/기능명` 또는 `fix/버그명`
3. **커밋 메시지**: [Conventional Commits](https://www.conventionalcommits.org/) 규칙 준수
4. **코드 리뷰**: 아키텍처 원칙 준수 여부 검토

## 📝 라이선스

이 프로젝트는 기존 우리샵 프로젝트의 일부로서 해당 프로젝트의 라이선스를 따릅니다.

---

**주의**: 이 문서는 클린 아키텍처로 리팩토링된 새로운 버전에 대한 것입니다. 기존 구현과 호환되지 않을 수 있으므로 마이그레이션 시 주의가 필요합니다.