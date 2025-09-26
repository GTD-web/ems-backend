import { EntityManager } from 'typeorm';
import type {
  EvaluationStatus,
  FinalGrade,
  JobGrade,
  EmployeeEvaluationStatusFilter,
  EmployeeEvaluationStatusStatistics,
  CreateEmployeeEvaluationStatusDto,
  UpdateEmployeeEvaluationStatusDto,
} from '../employee-evaluation-status.types';
import type { IEmployeeEvaluationStatus } from './employee-evaluation-status.interface';

/**
 * 직원 평가 상태 서비스 인터페이스
 */
export interface IEmployeeEvaluationStatusService {
  /**
   * ID로 직원 평가 상태를 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatus | null>;

  /**
   * 필터 조건으로 평가 상태를 조회한다
   */
  필터조회한다(
    filter: EmployeeEvaluationStatusFilter,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatus[]>;

  /**
   * 직원 평가 상태를 생성한다
   */
  생성한다(
    createDto: CreateEmployeeEvaluationStatusDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatus>;

  /**
   * 직원 평가 상태를 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateEmployeeEvaluationStatusDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatus>;

  /**
   * 직원 평가 상태를 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;
}
