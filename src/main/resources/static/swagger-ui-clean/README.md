# Swagger UI Clean Architecture

이 프로젝트는 기존 Swagger UI 커스터마이제이션 코드를 클린 아키텍처 패턴으로 리팩토링한 버전입니다.

## 🏗️ 아키텍처 개요

클린 아키텍처의 4개 주요 레이어로 구성되어 있습니다:

```
swagger-ui-clean/
├── domain/              # 도메인 레이어 (비즈니스 로직)
│   ├── entities/        # 도메인 엔티티
│   ├── repositories/    # 리포지토리 인터페이스
│   └── services/        # 도메인 서비스
├── application/         # 애플리케이션 레이어 (유스케이스)
│   ├── use-cases/      # 비즈니스 유스케이스
│   └── interfaces/     # 인터페이스 정의
├── infrastructure/     # 인프라스트럭처 레이어 (구현체)
│   ├── repositories/   # 리포지토리 구현
│   ├── api-clients/    # API 클라이언트
│   └── storage/        # 저장소 구현
├── presentation/       # 프레젠테이션 레이어 (UI)
│   ├── components/     # UI 컴포넌트
│   ├── controllers/    # 컨트롤러
│   └── views/          # 뷰 컴포넌트
└── shared/             # 공유 레이어
    ├── utils/          # 유틸리티 함수
    ├── constants/      # 상수 정의
    └── types/          # 타입 정의
```

## 🚀 주요 기능

### 1. API 상태 관리
- **엔티티**: `ApiStatus`, `ApiEndpoint`
- **서비스**: `ApiHighlightService`
- **유스케이스**: `HighlightApiUseCase`

API 상태에 따른 시각적 표시와 하이라이트 기능을 제공합니다.

### 2. 사이드바 관리
- **엔티티**: `SidebarState`
- **서비스**: 사이드바 토글 및 상태 관리
- **유스케이스**: `ManageSidebarUseCase`

사이드바의 접기/펼치기 기능과 상태 유지를 담당합니다.

### 3. 북마크 모달
- **엔티티**: `ModalState`
- **서비스**: `BookmarkService`
- **유스케이스**: `ManageBookmarkModalUseCase`

API 북마크 기능과 모달 UI를 관리합니다.

### 4. Swagger UI 초기화
- **유스케이스**: `InitializeSwaggerUseCase`
- **리포지토리**: `SwaggerRepository`, `ApiStatusRepository`

Swagger UI 초기화와 API 데이터 로딩을 담당합니다.

## 🔧 의존성 주입

### DependencyContainer
모든 의존성을 중앙에서 관리하는 컨테이너입니다:

```javascript
const container = new DependencyContainer();

// 사용 예시
const useCase = container.get('InitializeSwaggerUseCase');
await useCase.execute();
```

### 의존성 그래프
```
InitializeSwaggerUseCase
├── SwaggerRepository
├── ApiStatusRepository
├── SidebarStateRepository
└── ApiHighlightService
    └── ApiStatusRepository

ManageSidebarUseCase
├── SidebarStateRepository
├── TreeBuilder
└── SidebarRenderer

ManageBookmarkModalUseCase
├── BookmarkService
├── SwaggerRepository
├── ModalStateRepository
└── ModalRenderer
```

## 📝 사용 방법

### 1. 애플리케이션 시작
```javascript
import app from '/swagger-ui-clean/main.js';

// 애플리케이션은 자동으로 초기화됩니다
// 수동 초기화가 필요한 경우:
await app.initialize();
```

### 2. 개별 기능 사용
```javascript
// 의존성 컨테이너에서 직접 사용
import { container } from '/swagger-ui-clean/DependencyContainer.js';

const bookmarkService = container.get('BookmarkService');
bookmarkService.addBookmark('/api/users');

const sidebarUseCase = container.get('ManageSidebarUseCase');
await sidebarUseCase.toggleSidebar();
```

## 🏛️ 아키텍처 원칙

### 1. 의존성 역전 원칙 (DIP)
- 상위 레벨 모듈이 하위 레벨 모듈에 의존하지 않음
- 인터페이스를 통한 의존성 주입 사용

### 2. 단일 책임 원칙 (SRP)
- 각 클래스와 모듈은 하나의 책임만 가짐
- 변경의 이유가 하나뿐

### 3. 개방-폐쇄 원칙 (OCP)
- 확장에는 열려있고 수정에는 닫혀있음
- 인터페이스를 통한 확장성 제공

### 4. 인터페이스 분리 원칙 (ISP)
- 클라이언트가 사용하지 않는 인터페이스에 의존하지 않음
- 세분화된 인터페이스 설계

## 🔍 레이어별 상세 설명

### Domain Layer (도메인 레이어)
비즈니스 로직과 엔티티를 포함하는 핵심 레이어입니다.

**주요 컴포넌트**:
- `ApiStatus`: API 상태 정보를 나타내는 엔티티
- `ApiEndpoint`: API 엔드포인트 정보를 담는 엔티티
- `SidebarState`: 사이드바 상태를 관리하는 엔티티
- `BookmarkService`: 북마크 관련 비즈니스 로직

### Application Layer (애플리케이션 레이어)
도메인 레이어를 조합하여 구체적인 유스케이스를 구현합니다.

**주요 유스케이스**:
- `InitializeSwaggerUseCase`: Swagger UI 초기화
- `ManageSidebarUseCase`: 사이드바 관리
- `ManageBookmarkModalUseCase`: 북마크 모달 관리
- `HighlightApiUseCase`: API 하이라이트 관리

### Infrastructure Layer (인프라스트럭처 레이어)
외부 시스템과의 연동 및 데이터 저장을 담당합니다.

**주요 구현체**:
- `ApiStatusRepositoryImpl`: API 상태 데이터 저장소
- `SwaggerRepositoryImpl`: Swagger API 데이터 접근
- `StorageRepositoryImpl`: 브라우저 저장소 접근

### Presentation Layer (프레젠테이션 레이어)
사용자 인터페이스와 상호작용을 담당합니다.

**주요 컴포넌트**:
- `SidebarRendererImpl`: 사이드바 렌더링
- `ModalRendererImpl`: 모달 렌더링
- `HighlightRendererImpl`: API 하이라이트 렌더링

## 🧪 테스트

### 단위 테스트 작성 가이드
```javascript
// 예시: BookmarkService 테스트
import { BookmarkService } from '../domain/services/BookmarkService.js';

describe('BookmarkService', () => {
  let service;
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    service = new BookmarkService(mockStorage);
  });

  test('북마크 추가', () => {
    mockStorage.getItem.mockReturnValue('[]');
    
    service.addBookmark('/api/users');
    
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'swagger_bookmarks', 
      JSON.stringify(['/api/users'])
    );
  });
});
```

## 🚧 확장 가이드

### 새로운 기능 추가
1. **도메인 엔티티 정의**: `domain/entities/`에 새 엔티티 생성
2. **유스케이스 구현**: `application/use-cases/`에 비즈니스 로직 구현
3. **인프라 구현**: `infrastructure/`에 데이터 접근 로직 구현
4. **프레젠테이션 구현**: `presentation/`에 UI 컴포넌트 구현
5. **의존성 등록**: `DependencyContainer.js`에 의존성 추가

### 예시: 새로운 필터 기능 추가
```javascript
// 1. 도메인 엔티티
export class ApiFilter {
  constructor(criteria, value) {
    this.criteria = criteria;
    this.value = value;
  }
}

// 2. 유스케이스
export class FilterApiUseCase {
  constructor(swaggerRepository, filterRenderer) {
    this.swaggerRepository = swaggerRepository;
    this.filterRenderer = filterRenderer;
  }

  async execute(filter) {
    const apis = await this.swaggerRepository.getFilteredApis(filter);
    this.filterRenderer.render(apis);
  }
}

// 3. 의존성 등록
container.register('FilterApiUseCase', 
  new FilterApiUseCase(
    container.get('SwaggerRepository'),
    container.get('FilterRenderer')
  )
);
```

## 📈 성능 최적화

### 1. 지연 로딩
```javascript
// DependencyContainer에서 지연 로딩 사용
container.registerLazy('HeavyComponent', () => 
  new HeavyComponent()
);
```

### 2. 메모이제이션
```javascript
// API 응답 캐싱
class SwaggerRepositoryImpl {
  constructor() {
    this.cache = new Map();
  }

  async getSwaggerSpec(groupName) {
    if (this.cache.has(groupName)) {
      return this.cache.get(groupName);
    }
    
    const spec = await this.fetchSpec(groupName);
    this.cache.set(groupName, spec);
    return spec;
  }
}
```

## 🐛 디버깅

### 개발 모드
- 브라우저 개발자 도구에서 `window.swaggerApp`으로 애플리케이션 상태 확인
- `container.logStatus()`로 의존성 상태 확인

### 로깅
```javascript
// 각 레이어별 상세 로그 확인
console.log('애플리케이션 상태:', app.getStatus());
console.log('의존성 상태:', container.validateDependencies());
```

## 📚 참고 자료

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection Pattern](https://martinfowler.com/articles/injection.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

## 🤝 기여 가이드

1. 코드 스타일 가이드 준수
2. 각 레이어의 책임 경계 준수
3. 단위 테스트 작성
4. 문서 업데이트

## 📄 라이선스

이 프로젝트는 기존 프로젝트의 라이선스를 따릅니다.