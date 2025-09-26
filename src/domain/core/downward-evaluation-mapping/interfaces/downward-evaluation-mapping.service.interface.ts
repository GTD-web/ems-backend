import { EntityManager } from 'typeorm';
import type { IDownwardEvaluationMapping } from './downward-evaluation-mapping.interface';
import type {
  CreateDownwardEvaluationMappingData,
  UpdateDownwardEvaluationMappingData,
  DownwardEvaluationMappingFilter,
} from '../downward-evaluation-mapping.types';

/**
 * 하향평가 맵핑 서비스 인터페이스
 */
export interface IDownwardEvaluationMappingService {
  /**
   * ID로 하향평가 맵핑을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping | null>;

  /**
   * 피평가자별 하향평가 맵핑을 조회한다
   */
  피평가자별조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping[]>;

  /**
   * 평가자별 하향평가 맵핑을 조회한다
   */
  평가자별조회한다(
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping[]>;

  /**
   * 프로젝트별 하향평가 맵핑을 조회한다
   */
  프로젝트별조회한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping[]>;

  /**
   * 평가 기간별 하향평가 맵핑을 조회한다
   */
  평가기간별조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping[]>;

  /**
   * 필터 조건으로 하향평가 맵핑을 조회한다
   */
  필터조회한다(
    filter: DownwardEvaluationMappingFilter,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping[]>;

  /**
   * 하향평가 맵핑을 생성한다
   */
  생성한다(
    createData: CreateDownwardEvaluationMappingData,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping>;

  /**
   * 하향평가 맵핑을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdateDownwardEvaluationMappingData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping>;

  /**
   * 하향평가 맵핑을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 중복 하향평가 맵핑을 확인한다
   */
  중복맵핑확인한다(
    employeeId: string,
    evaluatorId: string,
    projectId: string,
    periodId: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 자기평가를 연결한다
   */
  자기평가연결한다(
    id: string,
    selfEvaluationId: string,
    connectedBy: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping>;

  /**
   * 자기평가 연결을 해제한다
   */
  자기평가연결해제한다(
    id: string,
    disconnectedBy: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluationMapping>;
}
