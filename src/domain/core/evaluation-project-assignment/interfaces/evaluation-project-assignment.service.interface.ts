import { EntityManager } from 'typeorm';
import type {
  EvaluationProjectAssignmentFilter,
  CreateEvaluationProjectAssignmentData,
  UpdateEvaluationProjectAssignmentData,
} from '../evaluation-project-assignment.types';
import type { IEvaluationProjectAssignment } from './evaluation-project-assignment.interface';

/**
 * 평가 프로젝트 할당 서비스 인터페이스
 */
export interface IEvaluationProjectAssignmentService {
  /**
   * ID로 평가 프로젝트 할당을 조회한다
   */
  ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment | null>;

  /**
   * 모든 평가 프로젝트 할당을 조회한다
   */
  전체_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment[]>;

  /**
   * 평가기간별 할당을 조회한다
   */
  평가기간별_조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment[]>;

  /**
   * 직원별 할당을 조회한다
   */
  직원별_조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment[]>;

  /**
   * 프로젝트별 할당을 조회한다
   */
  프로젝트별_조회한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment[]>;

  /**
   * 특정 평가기간의 직원별 할당을 조회한다
   */
  평가기간_직원별_조회한다(
    periodId: string,
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment[]>;

  /**
   * 필터 조건으로 할당을 조회한다
   */
  필터_조회한다(
    filter: EvaluationProjectAssignmentFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment[]>;

  /**
   * 평가 프로젝트 할당을 생성한다
   */
  생성한다(
    createData: CreateEvaluationProjectAssignmentData,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment>;

  /**
   * 평가 프로젝트 할당을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment>;

  /**
   * 평가 프로젝트 할당을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 특정 할당이 존재하는지 확인한다
   */
  할당_존재_확인한다(
    periodId: string,
    employeeId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 평가기간의 모든 할당을 삭제한다
   */
  평가기간_할당_전체삭제한다(
    periodId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 직원의 모든 할당을 삭제한다
   */
  직원_할당_전체삭제한다(
    employeeId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 프로젝트의 모든 할당을 삭제한다
   */
  프로젝트_할당_전체삭제한다(
    projectId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;
}
