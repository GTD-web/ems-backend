import { EntityManager } from 'typeorm';
import type { IPeerEvaluationMapping } from './peer-evaluation-mapping.interface';
import type {
  CreatePeerEvaluationMappingData,
  UpdatePeerEvaluationMappingData,
  PeerEvaluationMappingFilter,
} from '../peer-evaluation-mapping.types';

/**
 * 동료평가 맵핑 서비스 인터페이스
 */
export interface IPeerEvaluationMappingService {
  /**
   * ID로 동료평가 맵핑을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluationMapping | null>;

  /**
   * 피평가자별 동료평가 맵핑을 조회한다
   */
  피평가자별조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluationMapping[]>;

  /**
   * 평가자별 동료평가 맵핑을 조회한다
   */
  평가자별조회한다(
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluationMapping[]>;

  /**
   * 평가 기간별 동료평가 맵핑을 조회한다
   */
  평가기간별조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluationMapping[]>;

  /**
   * 필터 조건으로 동료평가 맵핑을 조회한다
   */
  필터조회한다(
    filter: PeerEvaluationMappingFilter,
    manager?: EntityManager,
  ): Promise<IPeerEvaluationMapping[]>;

  /**
   * 동료평가 맵핑을 생성한다
   */
  생성한다(
    createData: CreatePeerEvaluationMappingData,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluationMapping>;

  /**
   * 동료평가 맵핑을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdatePeerEvaluationMappingData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluationMapping>;

  /**
   * 동료평가 맵핑을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 중복 동료평가 맵핑을 확인한다
   */
  중복맵핑확인한다(
    employeeId: string,
    evaluatorId: string,
    periodId: string,
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
}
