import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEmployeeEvaluationStepApproval } from './interfaces/employee-evaluation-step-approval.interface';
import type {
  StepApprovalStatus,
  EmployeeEvaluationStepApprovalDto,
  CreateEmployeeEvaluationStepApprovalData,
} from './employee-evaluation-step-approval.types';
import { StepApprovalStatus as StepApprovalStatusEnum } from './employee-evaluation-step-approval.types';

/**
 * 직원 평가 단계 승인 엔티티
 * 평가기간별 직원의 각 평가 단계에 대한 승인 상태를 관리합니다.
 */
@Entity('employee_evaluation_step_approval')
@Index(['evaluationPeriodEmployeeMappingId'], { unique: true })
export class EmployeeEvaluationStepApproval
  extends BaseEntity<EmployeeEvaluationStepApprovalDto>
  implements IEmployeeEvaluationStepApproval
{
  @Column({
    type: 'uuid',
    unique: true,
    comment: '평가기간-직원 맵핑 ID',
  })
  evaluationPeriodEmployeeMappingId: string;

  // ==================== 평가기준 설정 ====================
  @Column({
    type: 'enum',
    enum: StepApprovalStatusEnum,
    enumName: 'step_approval_status_enum',
    default: StepApprovalStatusEnum.PENDING,
    comment: '평가기준 설정 상태',
  })
  criteriaSettingStatus: StepApprovalStatus;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '평가기준 설정 승인자 ID',
  })
  criteriaSettingApprovedBy: string | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '평가기준 설정 승인 일시',
  })
  criteriaSettingApprovedAt: Date | null;

  // ==================== 자기평가 ====================
  @Column({
    type: 'enum',
    enum: StepApprovalStatusEnum,
    enumName: 'step_approval_status_enum',
    default: StepApprovalStatusEnum.PENDING,
    comment: '자기평가 상태',
  })
  selfEvaluationStatus: StepApprovalStatus;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '자기평가 승인자 ID',
  })
  selfEvaluationApprovedBy: string | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '자기평가 승인 일시',
  })
  selfEvaluationApprovedAt: Date | null;

  // ==================== 1차 하향평가 ====================
  @Column({
    type: 'enum',
    enum: StepApprovalStatusEnum,
    enumName: 'step_approval_status_enum',
    default: StepApprovalStatusEnum.PENDING,
    comment: '1차 하향평가 상태',
  })
  primaryEvaluationStatus: StepApprovalStatus;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '1차 하향평가 승인자 ID',
  })
  primaryEvaluationApprovedBy: string | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '1차 하향평가 승인 일시',
  })
  primaryEvaluationApprovedAt: Date | null;

  // ==================== 2차 하향평가 ====================
  @Column({
    type: 'enum',
    enum: StepApprovalStatusEnum,
    enumName: 'step_approval_status_enum',
    default: StepApprovalStatusEnum.PENDING,
    comment: '2차 하향평가 상태',
  })
  secondaryEvaluationStatus: StepApprovalStatus;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '2차 하향평가 승인자 ID',
  })
  secondaryEvaluationApprovedBy: string | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '2차 하향평가 승인 일시',
  })
  secondaryEvaluationApprovedAt: Date | null;

  constructor(data?: CreateEmployeeEvaluationStepApprovalData) {
    super();
    if (data) {
      this.evaluationPeriodEmployeeMappingId =
        data.evaluationPeriodEmployeeMappingId;

      // 모든 단계를 pending 상태로 초기화
      this.criteriaSettingStatus = StepApprovalStatusEnum.PENDING;
      this.criteriaSettingApprovedBy = null;
      this.criteriaSettingApprovedAt = null;

      this.selfEvaluationStatus = StepApprovalStatusEnum.PENDING;
      this.selfEvaluationApprovedBy = null;
      this.selfEvaluationApprovedAt = null;

      this.primaryEvaluationStatus = StepApprovalStatusEnum.PENDING;
      this.primaryEvaluationApprovedBy = null;
      this.primaryEvaluationApprovedAt = null;

      this.secondaryEvaluationStatus = StepApprovalStatusEnum.PENDING;
      this.secondaryEvaluationApprovedBy = null;
      this.secondaryEvaluationApprovedAt = null;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  // ==================== 평가기준 설정 메서드 ====================

  /**
   * 평가기준 설정을 확인한다 (approved 상태로 변경)
   */
  평가기준설정_확인한다(approvedBy: string): void {
    this.criteriaSettingStatus = StepApprovalStatusEnum.APPROVED;
    this.criteriaSettingApprovedBy = approvedBy;
    this.criteriaSettingApprovedAt = new Date();
    this.메타데이터를_업데이트한다(approvedBy);
  }

  /**
   * 평가기준 설정을 대기 상태로 변경한다
   */
  평가기준설정_대기로_변경한다(updatedBy: string): void {
    this.criteriaSettingStatus = StepApprovalStatusEnum.PENDING;
    this.criteriaSettingApprovedBy = null;
    this.criteriaSettingApprovedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 평가기준 설정을 재작성 요청 상태로 변경한다
   */
  평가기준설정_재작성요청상태로_변경한다(updatedBy: string): void {
    this.criteriaSettingStatus = StepApprovalStatusEnum.REVISION_REQUESTED;
    this.criteriaSettingApprovedBy = null;
    this.criteriaSettingApprovedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  // ==================== 자기평가 메서드 ====================

  /**
   * 자기평가를 확인한다 (approved 상태로 변경)
   */
  자기평가_확인한다(approvedBy: string): void {
    this.selfEvaluationStatus = StepApprovalStatusEnum.APPROVED;
    this.selfEvaluationApprovedBy = approvedBy;
    this.selfEvaluationApprovedAt = new Date();
    this.메타데이터를_업데이트한다(approvedBy);
  }

  /**
   * 자기평가를 대기 상태로 변경한다
   */
  자기평가_대기로_변경한다(updatedBy: string): void {
    this.selfEvaluationStatus = StepApprovalStatusEnum.PENDING;
    this.selfEvaluationApprovedBy = null;
    this.selfEvaluationApprovedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 자기평가를 재작성 요청 상태로 변경한다
   */
  자기평가_재작성요청상태로_변경한다(updatedBy: string): void {
    this.selfEvaluationStatus = StepApprovalStatusEnum.REVISION_REQUESTED;
    this.selfEvaluationApprovedBy = null;
    this.selfEvaluationApprovedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  // ==================== 1차 하향평가 메서드 ====================

  /**
   * 1차 하향평가를 확인한다 (approved 상태로 변경)
   */
  일차평가_확인한다(approvedBy: string): void {
    this.primaryEvaluationStatus = StepApprovalStatusEnum.APPROVED;
    this.primaryEvaluationApprovedBy = approvedBy;
    this.primaryEvaluationApprovedAt = new Date();
    this.메타데이터를_업데이트한다(approvedBy);
  }

  /**
   * 1차 하향평가를 대기 상태로 변경한다
   */
  일차평가_대기로_변경한다(updatedBy: string): void {
    this.primaryEvaluationStatus = StepApprovalStatusEnum.PENDING;
    this.primaryEvaluationApprovedBy = null;
    this.primaryEvaluationApprovedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 1차 하향평가를 재작성 요청 상태로 변경한다
   */
  일차평가_재작성요청상태로_변경한다(updatedBy: string): void {
    this.primaryEvaluationStatus = StepApprovalStatusEnum.REVISION_REQUESTED;
    this.primaryEvaluationApprovedBy = null;
    this.primaryEvaluationApprovedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  // ==================== 2차 하향평가 메서드 ====================

  /**
   * 2차 하향평가를 확인한다 (approved 상태로 변경)
   */
  이차평가_확인한다(approvedBy: string): void {
    this.secondaryEvaluationStatus = StepApprovalStatusEnum.APPROVED;
    this.secondaryEvaluationApprovedBy = approvedBy;
    this.secondaryEvaluationApprovedAt = new Date();
    this.메타데이터를_업데이트한다(approvedBy);
  }

  /**
   * 2차 하향평가를 대기 상태로 변경한다
   */
  이차평가_대기로_변경한다(updatedBy: string): void {
    this.secondaryEvaluationStatus = StepApprovalStatusEnum.PENDING;
    this.secondaryEvaluationApprovedBy = null;
    this.secondaryEvaluationApprovedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 2차 하향평가를 재작성 요청 상태로 변경한다
   */
  이차평가_재작성요청상태로_변경한다(updatedBy: string): void {
    this.secondaryEvaluationStatus = StepApprovalStatusEnum.REVISION_REQUESTED;
    this.secondaryEvaluationApprovedBy = null;
    this.secondaryEvaluationApprovedAt = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  // ==================== DTO 변환 ====================

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): EmployeeEvaluationStepApprovalDto {
    return {
      id: this.id,
      evaluationPeriodEmployeeMappingId: this.evaluationPeriodEmployeeMappingId,

      criteriaSettingStatus: this.criteriaSettingStatus,
      criteriaSettingApprovedBy: this.criteriaSettingApprovedBy,
      criteriaSettingApprovedAt: this.criteriaSettingApprovedAt,

      selfEvaluationStatus: this.selfEvaluationStatus,
      selfEvaluationApprovedBy: this.selfEvaluationApprovedBy,
      selfEvaluationApprovedAt: this.selfEvaluationApprovedAt,

      primaryEvaluationStatus: this.primaryEvaluationStatus,
      primaryEvaluationApprovedBy: this.primaryEvaluationApprovedBy,
      primaryEvaluationApprovedAt: this.primaryEvaluationApprovedAt,

      secondaryEvaluationStatus: this.secondaryEvaluationStatus,
      secondaryEvaluationApprovedBy: this.secondaryEvaluationApprovedBy,
      secondaryEvaluationApprovedAt: this.secondaryEvaluationApprovedAt,

      createdBy: this.createdBy!,
      updatedBy: this.updatedBy!,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
