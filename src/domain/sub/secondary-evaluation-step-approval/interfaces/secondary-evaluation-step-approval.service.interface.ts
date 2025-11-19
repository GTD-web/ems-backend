import type { SecondaryEvaluationStepApproval } from '../secondary-evaluation-step-approval.entity';
import type {
  CreateSecondaryEvaluationStepApprovalData,
  StepApprovalStatus,
} from '../secondary-evaluation-step-approval.types';

/**
 * 2차 평가자별 단계 승인 서비스 인터페이스
 */
export interface ISecondaryEvaluationStepApprovalService {
  /**
   * ID로 2차 평가자별 단계 승인을 조회한다
   */
  ID로_조회한다(
    id: string,
  ): Promise<SecondaryEvaluationStepApproval | null>;

  /**
   * 맵핑 ID와 평가자 ID로 단계 승인을 조회한다
   */
  맵핑ID와_평가자ID로_조회한다(
    mappingId: string,
    evaluatorId: string,
  ): Promise<SecondaryEvaluationStepApproval | null>;

  /**
   * 맵핑 ID로 모든 2차 평가자별 단계 승인을 조회한다
   */
  맵핑ID로_모두_조회한다(
    mappingId: string,
  ): Promise<SecondaryEvaluationStepApproval[]>;

  /**
   * 평가자 ID로 모든 단계 승인을 조회한다
   */
  평가자ID로_조회한다(
    evaluatorId: string,
  ): Promise<SecondaryEvaluationStepApproval[]>;

  /**
   * 2차 평가자별 단계 승인을 생성한다
   */
  생성한다(
    data: CreateSecondaryEvaluationStepApprovalData,
  ): Promise<SecondaryEvaluationStepApproval>;

  /**
   * 2차 평가자별 단계 승인을 저장한다
   */
  저장한다(
    approval: SecondaryEvaluationStepApproval,
  ): Promise<SecondaryEvaluationStepApproval>;

  /**
   * 승인 상태를 변경한다
   */
  상태를_변경한다(
    approval: SecondaryEvaluationStepApproval,
    status: StepApprovalStatus,
    updatedBy: string,
    revisionRequestId?: string | null,
  ): void;

  /**
   * 2차 평가자별 단계 승인을 삭제한다 (소프트 삭제)
   */
  삭제한다(id: string, deletedBy: string): Promise<void>;
}

