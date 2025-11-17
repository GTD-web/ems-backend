import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { ISecondaryEvaluationStepApproval } from './interfaces/secondary-evaluation-step-approval.interface';
import type {
  SecondaryEvaluationStepApprovalDto,
  CreateSecondaryEvaluationStepApprovalData,
} from './secondary-evaluation-step-approval.types';
import { StepApprovalStatus } from '../employee-evaluation-step-approval/employee-evaluation-step-approval.types';

/**
 * 2차 평가자별 단계 승인 엔티티
 * 평가기간별 직원의 2차 평가자별 개별 승인 상태를 관리합니다.
 */
@Entity('secondary_evaluation_step_approval')
@Index(['evaluationPeriodEmployeeMappingId', 'evaluatorId'], {
  unique: true,
})
export class SecondaryEvaluationStepApproval
  extends BaseEntity<SecondaryEvaluationStepApprovalDto>
  implements ISecondaryEvaluationStepApproval
{
  @Column({
    type: 'uuid',
    comment: '평가기간-직원 맵핑 ID',
  })
  evaluationPeriodEmployeeMappingId: string;

  @Column({
    type: 'uuid',
    comment: '2차 평가자 ID',
  })
  evaluatorId: string;

  @Column({
    type: 'enum',
    enum: StepApprovalStatus,
    enumName: 'step_approval_status_enum',
    default: StepApprovalStatus.PENDING,
    comment: '승인 상태',
  })
  status: StepApprovalStatus;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '승인자 ID',
  })
  approvedBy: string | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '승인 일시',
  })
  approvedAt: Date | null;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '재작성 요청 ID',
  })
  revisionRequestId: string | null;

  constructor(data?: CreateSecondaryEvaluationStepApprovalData) {
    super();
    if (data) {
      this.evaluationPeriodEmployeeMappingId =
        data.evaluationPeriodEmployeeMappingId;
      this.evaluatorId = data.evaluatorId;
      this.status = data.status || StepApprovalStatus.PENDING;
      this.approvedBy = data.approvedBy ?? null;
      this.approvedAt = data.approvedAt ?? null;
      this.revisionRequestId = data.revisionRequestId ?? null;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  // ==================== 승인 상태 변경 메서드 ====================

  /**
   * 승인 상태로 변경한다 (approved)
   */
  승인한다(approvedBy: string): void {
    this.status = StepApprovalStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.메타데이터를_업데이트한다(approvedBy);
  }

  /**
   * 대기 상태로 변경한다 (pending)
   */
  대기로_변경한다(updatedBy: string): void {
    this.status = StepApprovalStatus.PENDING;
    this.approvedBy = null;
    this.approvedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 재작성 요청 상태로 변경한다 (revision_requested)
   */
  재작성요청상태로_변경한다(
    updatedBy: string,
    revisionRequestId: string,
  ): void {
    this.status = StepApprovalStatus.REVISION_REQUESTED;
    this.revisionRequestId = revisionRequestId;
    this.approvedBy = null;
    this.approvedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 재작성 완료 상태로 변경한다 (revision_completed)
   */
  재작성완료상태로_변경한다(
    updatedBy: string,
    revisionRequestId?: string | null,
  ): void {
    this.status = StepApprovalStatus.REVISION_COMPLETED;
    if (revisionRequestId !== undefined) {
      this.revisionRequestId = revisionRequestId;
    }
    this.approvedBy = null;
    this.approvedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  // ==================== DTO 변환 ====================

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): SecondaryEvaluationStepApprovalDto {
    return {
      id: this.id,
      evaluationPeriodEmployeeMappingId: this.evaluationPeriodEmployeeMappingId,
      evaluatorId: this.evaluatorId,
      status: this.status,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      revisionRequestId: this.revisionRequestId,
      createdBy: this.createdBy!,
      updatedBy: this.updatedBy!,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
