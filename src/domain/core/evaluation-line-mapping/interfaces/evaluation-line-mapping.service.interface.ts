import { EntityManager } from 'typeorm';
import type { IEvaluationLineMapping } from './evaluation-line-mapping.interface';
import type {
  CreateEvaluationLineMappingData,
  UpdateEvaluationLineMappingData,
  EvaluationLineMappingFilter,
} from '../evaluation-line-mapping.types';

/**
 * 평가 라인 맵핑 서비스 인터페이스
 */
export interface IEvaluationLineMappingService {
  /**
   * ID로 평가 라인 맵핑을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping | null>;

  /**
   * 피평가자별 평가 라인 맵핑을 조회한다
   */
  피평가자별조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]>;

  /**
   * 평가자별 평가 라인 맵핑을 조회한다
   */
  평가자별조회한다(
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]>;

  /**
   * 프로젝트별 평가 라인 맵핑을 조회한다
   */
  프로젝트별조회한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]>;

  /**
   * 필터 조건으로 평가 라인 맵핑을 조회한다
   */
  필터조회한다(
    filter: EvaluationLineMappingFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]>;

  /**
   * 평가 라인 맵핑을 생성한다
   */
  생성한다(
    createData: CreateEvaluationLineMappingData,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping>;

  /**
   * 평가 라인 맵핑을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdateEvaluationLineMappingData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping>;

  /**
   * 평가 라인 맵핑을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 중복 평가 라인 맵핑을 확인한다
   */
  중복맵핑확인한다(
    employeeId: string,
    evaluatorId: string,
    projectId?: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 자기평가 맵핑을 확인한다
   */
  자기평가맵핑확인한다(
    employeeId: string,
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 프로젝트를 연결한다
   */
  프로젝트연결한다(
    id: string,
    projectId: string,
    connectedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping>;

  /**
   * 프로젝트 연결을 해제한다
   */
  프로젝트연결해제한다(
    id: string,
    disconnectedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping>;
}
