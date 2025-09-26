import { EntityManager } from 'typeorm';
import type {
  IPeerEvaluation,
  PeerEvaluationStatus,
} from './peer-evaluation.interface';
import type {
  CreatePeerEvaluationDto,
  UpdatePeerEvaluationDto,
  PeerEvaluationFilter,
  PeerEvaluationStatistics,
} from '../peer-evaluation.types';

/**
 * 동료 평가 서비스 인터페이스
 */
export interface IPeerEvaluationService {
  /**
   * ID로 동료 평가를 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluation | null>;

  /**
   * 상태별 동료 평가를 조회한다
   */
  상태별조회한다(
    status: PeerEvaluationStatus,
    manager?: EntityManager,
  ): Promise<IPeerEvaluation[]>;

  /**
   * 필터 조건으로 동료 평가를 조회한다
   */
  필터조회한다(
    filter: PeerEvaluationFilter,
    manager?: EntityManager,
  ): Promise<IPeerEvaluation[]>;

  /**
   * 동료 평가를 생성한다
   */
  생성한다(
    createDto: CreatePeerEvaluationDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluation>;

  /**
   * 동료 평가를 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdatePeerEvaluationDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluation>;

  /**
   * 동료 평가를 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 동료 평가를 시작한다
   */
  시작한다(
    id: string,
    startedBy: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluation>;

  /**
   * 동료 평가를 완료한다
   */
  완료한다(
    id: string,
    completedBy: string,
    manager?: EntityManager,
  ): Promise<IPeerEvaluation>;
}
