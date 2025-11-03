import type { EmployeeEvaluationStepApproval } from '../employee-evaluation-step-approval.entity';
import type {
  CreateEmployeeEvaluationStepApprovalData,
  StepType,
  StepApprovalStatus,
} from '../employee-evaluation-step-approval.types';

/**
 * 직원 평가 단계 승인 서비스 인터페이스
 */
export interface IEmployeeEvaluationStepApprovalService {
  /**
   * ID로 단계 승인을 조회한다
   */
  ID로_조회한다(id: string): Promise<EmployeeEvaluationStepApproval | null>;

  /**
   * 맵핑 ID로 단계 승인을 조회한다
   */
  맵핑ID로_조회한다(
    mappingId: string,
  ): Promise<EmployeeEvaluationStepApproval | null>;

  /**
   * 단계 승인을 생성한다
   */
  생성한다(
    data: CreateEmployeeEvaluationStepApprovalData,
  ): Promise<EmployeeEvaluationStepApproval>;

  /**
   * 단계 승인을 저장한다
   */
  저장한다(
    stepApproval: EmployeeEvaluationStepApproval,
  ): Promise<EmployeeEvaluationStepApproval>;

  /**
   * 특정 단계의 상태를 변경한다
   */
  단계_상태를_변경한다(
    stepApproval: EmployeeEvaluationStepApproval,
    step: StepType,
    status: StepApprovalStatus,
    updatedBy: string,
  ): void;

  /**
   * 단계 승인을 삭제한다 (소프트 삭제)
   */
  삭제한다(id: string, deletedBy: string): Promise<void>;
}

