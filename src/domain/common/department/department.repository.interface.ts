import { EntityManager } from 'typeorm';
import { Department } from './department.entity';
import { DepartmentFilter, DepartmentStatistics } from './department.types';

/**
 * 부서 리포지토리 인터페이스
 *
 * 현재 DepartmentRepository에 구현된 메서드들을 기반으로 정의합니다.
 * 트랜잭션 관리를 위해 EntityManager를 선택적으로 받을 수 있습니다.
 */
export interface IDepartmentRepository {
  // 기본 CRUD 작업
  /**
   * ID로 부서를 조회한다
   */
  findById(id: string, manager?: EntityManager): Promise<Department | null>;

  /**
   * 외부 ID로 부서를 조회한다
   */
  findByExternalId(
    externalId: string,
    manager?: EntityManager,
  ): Promise<Department | null>;

  /**
   * 모든 부서를 조회한다
   */
  findAll(manager?: EntityManager): Promise<Department[]>;

  /**
   * 필터 조건으로 부서를 조회한다
   */
  findByFilter(
    filter: DepartmentFilter,
    manager?: EntityManager,
  ): Promise<Department[]>;

  /**
   * 부서를 저장한다
   */
  save(department: Department, manager?: EntityManager): Promise<Department>;

  /**
   * 여러 부서를 일괄 저장한다
   */
  saveMany(
    departments: Department[],
    manager?: EntityManager,
  ): Promise<Department[]>;

  /**
   * 부서를 삭제한다
   */
  delete(id: string, manager?: EntityManager): Promise<void>;

  // 고유 필드 조회
  /**
   * 부서명으로 부서를 조회한다
   */
  findByName(name: string, manager?: EntityManager): Promise<Department | null>;

  /**
   * 부서 코드로 부서를 조회한다
   */
  findByCode(code: string, manager?: EntityManager): Promise<Department | null>;

  // 계층 구조 조회
  /**
   * 상위 부서별 하위 부서를 조회한다
   */
  findByParentDepartmentId(
    parentDepartmentId: string,
    manager?: EntityManager,
  ): Promise<Department[]>;

  /**
   * 루트 부서 목록을 조회한다 (상위 부서가 없는 부서)
   */
  findRootDepartments(manager?: EntityManager): Promise<Department[]>;

  /**
   * 부서 통계를 조회한다
   */
  getDepartmentStats(manager?: EntityManager): Promise<DepartmentStatistics>;

  /**
   * 동기화가 필요한 부서들을 조회한다
   */
  findOutdatedDepartments(manager?: EntityManager): Promise<Department[]>;

  /**
   * 마지막 동기화 시간을 업데이트한다
   */
  updateLastSyncAt(
    externalIds: string[],
    syncTime: Date,
    manager?: EntityManager,
  ): Promise<void>;
}
