/**
 * 의존성 주입 컨테이너
 * 클린 아키텍처의 의존성 역전 원칙을 구현합니다
 */

// Domain Services
import { ApiHighlightService } from './domain/services/ApiHighlightService.js';
import { BookmarkService } from './domain/services/BookmarkService.js';

// Infrastructure Repositories
import { ApiStatusRepositoryImpl } from './infrastructure/repositories/ApiStatusRepositoryImpl.js';
import { SwaggerRepositoryImpl } from './infrastructure/repositories/SwaggerRepositoryImpl.js';
import { StorageRepositoryImpl } from './infrastructure/repositories/StorageRepositoryImpl.js';

// Infrastructure Storage
import { SidebarStateRepository } from './infrastructure/storage/SidebarStateRepository.js';
import { ModalStateRepository } from './infrastructure/storage/ModalStateRepository.js';

// Presentation Components
import { TreeBuilderImpl } from './presentation/components/TreeBuilderImpl.js';
import { SidebarRendererImpl } from './presentation/components/SidebarRendererImpl.js';
import { ModalRendererImpl } from './presentation/components/ModalRendererImpl.js';
import { HighlightRendererImpl } from './presentation/components/HighlightRendererImpl.js';

// Use Cases
import { InitializeSwaggerUseCase } from './application/use-cases/InitializeSwaggerUseCase.js';
import { ManageSidebarUseCase } from './application/use-cases/ManageSidebarUseCase.js';
import { ManageBookmarkModalUseCase } from './application/use-cases/ManageBookmarkModalUseCase.js';
import { HighlightApiUseCase } from './application/use-cases/HighlightApiUseCase.js';

/**
 * 의존성 컨테이너 클래스
 * 싱글톤 패턴으로 구현되어 전역에서 하나의 인스턴스만 존재합니다
 */
export class DependencyContainer {
  constructor() {
    if (DependencyContainer.instance) {
      return DependencyContainer.instance;
    }

    this.dependencies = new Map();
    this.initialize();
    
    DependencyContainer.instance = this;
  }

  /**
   * 모든 의존성을 초기화합니다
   */
  initialize() {
    // Infrastructure Layer 의존성 등록
    this.registerInfrastructureDependencies();
    
    // Domain Layer 의존성 등록
    this.registerDomainDependencies();
    
    // Presentation Layer 의존성 등록
    this.registerPresentationDependencies();
    
    // Application Layer 의존성 등록
    this.registerApplicationDependencies();
  }

  /**
   * Infrastructure Layer 의존성들을 등록합니다
   */
  registerInfrastructureDependencies() {
    // Repository 구현체들
    this.register('StorageRepository', new StorageRepositoryImpl());
    this.register('ApiStatusRepository', new ApiStatusRepositoryImpl());
    this.register('SwaggerRepository', new SwaggerRepositoryImpl());
    
    // State Repository들
    this.register('SidebarStateRepository', 
      new SidebarStateRepository(this.get('StorageRepository'))
    );
    this.register('ModalStateRepository', 
      new ModalStateRepository(this.get('StorageRepository'))
    );
  }

  /**
   * Domain Layer 의존성들을 등록합니다
   */
  registerDomainDependencies() {
    // Domain Services
    this.register('ApiHighlightService', 
      new ApiHighlightService(this.get('ApiStatusRepository'))
    );
    this.register('BookmarkService', 
      new BookmarkService(this.get('StorageRepository'))
    );
  }

  /**
   * Presentation Layer 의존성들을 등록합니다
   */
  registerPresentationDependencies() {
    // Presentation Components
    this.register('TreeBuilder', new TreeBuilderImpl());
    this.register('HighlightRenderer', new HighlightRendererImpl());
    this.register('ModalRenderer', new ModalRendererImpl());
    
    // SidebarRenderer는 초기화 지연 (순환 의존성 방지)
    this.registerLazy('SidebarRenderer', () => 
      new SidebarRendererImpl(this.get('InitializeSwaggerUseCase'))
    );
  }

  /**
   * Application Layer 의존성들을 등록합니다
   */
  registerApplicationDependencies() {
    // Use Cases
    this.register('InitializeSwaggerUseCase', 
      new InitializeSwaggerUseCase(
        this.get('SwaggerRepository'),
        this.get('ApiStatusRepository'),
        this.get('SidebarStateRepository'),
        this.get('ApiHighlightService')
      )
    );

    this.register('ManageSidebarUseCase', 
      new ManageSidebarUseCase(
        this.get('SidebarStateRepository'),
        this.get('TreeBuilder'),
        this.get('SidebarRenderer')
      )
    );

    this.register('ManageBookmarkModalUseCase', 
      new ManageBookmarkModalUseCase(
        this.get('BookmarkService'),
        this.get('SwaggerRepository'),
        this.get('ModalStateRepository'),
        this.get('ModalRenderer')
      )
    );

    this.register('HighlightApiUseCase', 
      new HighlightApiUseCase(
        this.get('ApiHighlightService'),
        this.get('ApiStatusRepository'),
        this.get('HighlightRenderer')
      )
    );
  }

  /**
   * 의존성을 등록합니다
   * @param {string} name 
   * @param {*} instance 
   */
  register(name, instance) {
    this.dependencies.set(name, instance);
  }

  /**
   * 지연 로딩 의존성을 등록합니다
   * @param {string} name 
   * @param {Function} factory 
   */
  registerLazy(name, factory) {
    this.dependencies.set(name, { lazy: true, factory });
  }

  /**
   * 의존성을 가져옵니다
   * @param {string} name 
   * @returns {*}
   */
  get(name) {
    const dependency = this.dependencies.get(name);
    
    if (!dependency) {
      throw new Error(`의존성을 찾을 수 없습니다: ${name}`);
    }

    // 지연 로딩 처리
    if (dependency.lazy) {
      const instance = dependency.factory();
      this.dependencies.set(name, instance);
      return instance;
    }

    return dependency;
  }

  /**
   * 의존성이 등록되어 있는지 확인합니다
   * @param {string} name 
   * @returns {boolean}
   */
  has(name) {
    return this.dependencies.has(name);
  }

  /**
   * 의존성을 제거합니다
   * @param {string} name 
   */
  remove(name) {
    this.dependencies.delete(name);
  }

  /**
   * 모든 의존성을 초기화합니다
   */
  clear() {
    this.dependencies.clear();
  }

  /**
   * 등록된 모든 의존성의 이름을 반환합니다
   * @returns {Array<string>}
   */
  getRegisteredNames() {
    return Array.from(this.dependencies.keys());
  }

  /**
   * 의존성 그래프를 검증합니다
   * @returns {Object}
   */
  validateDependencies() {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // 각 의존성을 실제로 로드해보며 검증
      for (const name of this.getRegisteredNames()) {
        try {
          this.get(name);
        } catch (error) {
          result.isValid = false;
          result.errors.push(`${name}: ${error.message}`);
        }
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(`전체 검증 실패: ${error.message}`);
    }

    return result;
  }

  /**
   * 컨테이너 상태를 로깅합니다
   */
  logStatus() {
    console.group('🔧 Dependency Container Status');
    console.log('등록된 의존성 개수:', this.dependencies.size);
    console.log('등록된 의존성들:', this.getRegisteredNames());
    
    const validation = this.validateDependencies();
    if (validation.isValid) {
      console.log('✅ 모든 의존성이 정상적으로 등록되었습니다');
    } else {
      console.error('❌ 의존성 오류:', validation.errors);
    }
    
    console.groupEnd();
  }
}

// 싱글톤 인스턴스 생성
export const container = new DependencyContainer();