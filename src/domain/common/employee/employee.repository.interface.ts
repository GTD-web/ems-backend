import { EntityManager } from 'typeorm';
import { Employee } from './employee.entity';
import {
  EmployeeStatus,
  EmployeeGender,
  EmployeeFilter,
  EmployeeStatistics,
} from './employee.types';

/**
 * 직원 리포지토리 인터페이스
 *
 * 현재 EmployeeRepository에 구현된 메서드들을 기반으로 정의합니다.
 * 트랜잭션 관리를 위해 EntityManager를 선택적으로 받을 수 있습니다.
 */
export interface IEmployeeRepository {
  // 기본 CRUD 작업
  /**
   * ID로 직원을 조회한다
   */
  findById(id: string, manager?: EntityManager): Promise<Employee | null>;

  /**
   * 외부 ID로 직원을 조회한다
   */
  findByExternalId(
    externalId: string,
    manager?: EntityManager,
  ): Promise<Employee | null>;

  /**
   * 모든 직원을 조회한다
   */
  findAll(manager?: EntityManager): Promise<Employee[]>;

  /**
   * 직원을 저장한다
   */
  save(employee: Employee, manager?: EntityManager): Promise<Employee>;

  /**
   * 여러 직원을 일괄 저장한다
   */
  saveMany(employees: Employee[], manager?: EntityManager): Promise<Employee[]>;

  /**
   * 직원을 삭제한다
   */
  delete(id: string, manager?: EntityManager): Promise<void>;

  // 고유 필드 조회
  /**
   * 직원번호로 직원을 조회한다
   */
  findByEmployeeNumber(
    employeeNumber: string,
    manager?: EntityManager,
  ): Promise<Employee | null>;

  /**
   * 이메일로 직원을 조회한다
   */
  findByEmail(email: string, manager?: EntityManager): Promise<Employee | null>;

  // 필터링 및 검색
  /**
   * 필터 조건으로 직원을 조회한다
   */
  findByFilter(
    filter: EmployeeFilter,
    manager?: EntityManager,
  ): Promise<Employee[]>;

  /**
   * 부서별 직원 목록을 조회한다
   */
  findByDepartmentId(
    departmentId: string,
    manager?: EntityManager,
  ): Promise<Employee[]>;

  /**
   * 상태별 직원을 조회한다
   */
  findByStatus(
    status: EmployeeStatus,
    manager?: EntityManager,
  ): Promise<Employee[]>;

  /**
   * 성별로 직원을 조회한다
   */
  findByGender(
    gender: EmployeeGender,
    manager?: EntityManager,
  ): Promise<Employee[]>;

  /**
   * 직급별 직원을 조회한다
   */
  findByPositionId(
    positionId: string,
    manager?: EntityManager,
  ): Promise<Employee[]>;

  /**
   * 직책별 직원을 조회한다
   */
  findByRankId(rankId: string, manager?: EntityManager): Promise<Employee[]>;

  /**
   * 활성 직원 목록을 조회한다
   */
  findActiveEmployees(manager?: EntityManager): Promise<Employee[]>;

  /**
   * 직원명으로 검색한다 (부분 일치)
   */
  searchByName(
    searchTerm: string,
    manager?: EntityManager,
  ): Promise<Employee[]>;

  /**
   * 직원 통계를 조회한다
   */
  getEmployeeStats(manager?: EntityManager): Promise<EmployeeStatistics>;
}
