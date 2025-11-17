import { Repository, IsNull } from 'typeorm';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { SecondaryEvaluationStepApproval } from '@domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.entity';
import { RecipientType } from '@domain/sub/evaluation-revision-request';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';

/**
 * 평가자별 재작성 요청 상태 정보
 */
export interface EvaluatorRevisionRequestStatus {
  /** 평가자 ID */
  evaluatorId: string;
  /** 재작성 요청 상태 */
  status: StepApprovalStatus;
  /** 재작성 요청 ID */
  revisionRequestId: string | null;
  /** 재작성 요청 코멘트 */
  revisionComment: string | null;
  /** 재작성 완료 여부 */
  isCompleted: boolean;
  /** 재작성 완료 일시 */
  completedAt: Date | null;
  /** 재작성 완료 응답 코멘트 */
  responseComment: string | null;
  /** 요청 일시 */
  requestedAt: Date | null;
  /** 승인자 ID (approved 상태일 때) */
  approvedBy: string | null;
  /** 승인 일시 (approved 상태일 때) */
  approvedAt: Date | null;
}

/**
 * 평가자별 2차 평가 단계 승인 상태를 조회한다 (개선 버전)
 *
 * 1. 재작성 요청 테이블에서 평가자별 재작성 요청 상태 조회
 * 2. 재작성 요청이 없으면 secondary_evaluation_step_approval 테이블에서 approved 상태 조회
 * 3. 둘 다 없으면 pending 상태 반환
 *
 * @param evaluationPeriodId 평가기간 ID
 * @param employeeId 직원 ID
 * @param evaluatorId 평가자 ID
 * @param mappingId 평가기간-직원 맵핑 ID
 * @param revisionRequestRepository 재작성 요청 Repository
 * @param revisionRequestRecipientRepository 재작성 요청 수신자 Repository
 * @param secondaryStepApprovalRepository 2차 평가자별 단계 승인 Repository
 * @returns 평가자별 재작성 요청 상태 정보
 */
export async function 평가자별_2차평가_단계승인_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorId: string,
  mappingId: string,
  revisionRequestRepository: Repository<EvaluationRevisionRequest>,
  revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>,
  secondaryStepApprovalRepository: Repository<SecondaryEvaluationStepApproval>,
): Promise<EvaluatorRevisionRequestStatus> {
  // 1. secondary_evaluation_step_approval 테이블에서 승인 상태 조회 (최종 상태 기준)
  const secondaryApproval = await secondaryStepApprovalRepository.findOne({
    where: {
      evaluationPeriodEmployeeMappingId: mappingId,
      evaluatorId: evaluatorId,
      deletedAt: IsNull(),
    },
  });

  // 2. secondary_evaluation_step_approval 상태가 있는 경우
  if (secondaryApproval) {
    // 재작성 요청 정보 조회 (모든 상태에서 확인)
    const recipient = await revisionRequestRecipientRepository
      .createQueryBuilder('recipient')
      .leftJoinAndSelect('recipient.revisionRequest', 'request')
      .where('request.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('request.employeeId = :employeeId', { employeeId })
      .andWhere('request.step = :step', { step: 'secondary' })
      .andWhere('recipient.recipientId = :evaluatorId', { evaluatorId })
      .andWhere('recipient.recipientType = :recipientType', {
        recipientType: RecipientType.SECONDARY_EVALUATOR,
      })
      .andWhere('recipient.deletedAt IS NULL')
      .andWhere('request.deletedAt IS NULL')
      .orderBy('request.requestedAt', 'DESC')
      .getOne();

    // 재작성 요청이 있는 경우: 재작성 요청 상태 반환
    if (recipient && recipient.revisionRequest) {
      const request = recipient.revisionRequest;
      const status: StepApprovalStatus = recipient.isCompleted
        ? ('revision_completed' as StepApprovalStatus)
        : ('revision_requested' as StepApprovalStatus);

      return {
        evaluatorId,
        status,
        revisionRequestId: request.id,
        revisionComment: request.comment,
        isCompleted: recipient.isCompleted,
        completedAt: recipient.completedAt,
        responseComment: recipient.responseComment,
        requestedAt: request.requestedAt,
        approvedBy: null, // 재작성 요청 중에는 승인 정보 없음
        approvedAt: null,
      };
    }

    // 재작성 요청이 없는 경우:
    // - secondaryApproval.status가 approved여도 재작성 요청이 없으면 pending 반환
    // - revision_requested 또는 revision_completed 상태는 위에서 이미 처리됨
    if (secondaryApproval.status === 'approved') {
      // 재작성 요청이 없으면 pending 반환
      return {
        evaluatorId,
        status: 'pending' as StepApprovalStatus,
        revisionRequestId: null,
        revisionComment: null,
        isCompleted: false,
        completedAt: null,
        responseComment: null,
        requestedAt: null,
        approvedBy: null,
        approvedAt: null,
      };
    }

    // revision_requested 또는 revision_completed 상태인 경우 (이미 처리되었지만 안전장치)
    return {
      evaluatorId,
      status: secondaryApproval.status as StepApprovalStatus,
      revisionRequestId: secondaryApproval.revisionRequestId,
      revisionComment: null,
      isCompleted: false,
      completedAt: null,
      responseComment: null,
      requestedAt: null,
      approvedBy: secondaryApproval.approvedBy,
      approvedAt: secondaryApproval.approvedAt,
    };
  }

  // 3. secondary_evaluation_step_approval 상태가 없는 경우: 재작성 요청 조회
  const recipient = await revisionRequestRecipientRepository
    .createQueryBuilder('recipient')
    .leftJoinAndSelect('recipient.revisionRequest', 'request')
    .where('request.evaluationPeriodId = :evaluationPeriodId', {
      evaluationPeriodId,
    })
    .andWhere('request.employeeId = :employeeId', { employeeId })
    .andWhere('request.step = :step', { step: 'secondary' })
    .andWhere('recipient.recipientId = :evaluatorId', { evaluatorId })
    .andWhere('recipient.recipientType = :recipientType', {
      recipientType: RecipientType.SECONDARY_EVALUATOR,
    })
    .andWhere('recipient.deletedAt IS NULL')
    .andWhere('request.deletedAt IS NULL')
    .orderBy('request.requestedAt', 'DESC')
    .getOne();

  // 4. 재작성 요청이 있는 경우
  if (recipient && recipient.revisionRequest) {
    const request = recipient.revisionRequest;
    const status: StepApprovalStatus = recipient.isCompleted
      ? ('revision_completed' as StepApprovalStatus)
      : ('revision_requested' as StepApprovalStatus);

    return {
      evaluatorId,
      status,
      revisionRequestId: request.id,
      revisionComment: request.comment,
      isCompleted: recipient.isCompleted,
      completedAt: recipient.completedAt,
      responseComment: recipient.responseComment,
      requestedAt: request.requestedAt,
      approvedBy: null, // 재작성 요청 중에는 승인 정보 없음
      approvedAt: null,
    };
  }

  // 5. 둘 다 없으면 pending 상태
  return {
    evaluatorId,
    status: 'pending' as StepApprovalStatus,
    revisionRequestId: null,
    revisionComment: null,
    isCompleted: false,
    completedAt: null,
    responseComment: null,
    requestedAt: null,
    approvedBy: null,
    approvedAt: null,
  };
}

/**
 * 1차 평가 단계 승인 상태를 조회한다
 *
 * 재작성 요청 테이블에서 1차 평가자 상태를 조회하여 반환합니다.
 *
 * @param evaluationPeriodId 평가기간 ID
 * @param employeeId 직원 ID
 * @param evaluatorId 평가자 ID
 * @param revisionRequestRepository 재작성 요청 Repository
 * @param revisionRequestRecipientRepository 재작성 요청 수신자 Repository
 * @returns 재작성 요청 상태 정보
 */
export async function 일차평가_단계승인_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorId: string,
  revisionRequestRepository: Repository<EvaluationRevisionRequest>,
  revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>,
): Promise<EvaluatorRevisionRequestStatus> {
  // 1. 해당 평가자에게 전송된 재작성 요청 조회
  // - 평가기간 ID, 직원 ID, 단계('primary'), 수신자 ID로 조회
  const recipient = await revisionRequestRecipientRepository
    .createQueryBuilder('recipient')
    .leftJoinAndSelect('recipient.revisionRequest', 'request')
    .where('request.evaluationPeriodId = :evaluationPeriodId', {
      evaluationPeriodId,
    })
    .andWhere('request.employeeId = :employeeId', { employeeId })
    .andWhere('request.step = :step', { step: 'primary' })
    .andWhere('recipient.recipientId = :evaluatorId', { evaluatorId })
    .andWhere('recipient.recipientType = :recipientType', {
      recipientType: RecipientType.PRIMARY_EVALUATOR,
    })
    .andWhere('recipient.deletedAt IS NULL')
    .andWhere('request.deletedAt IS NULL')
    .orderBy('request.requestedAt', 'DESC')
    .getOne();

  // 재작성 요청이 없으면 기본 상태 반환
  if (!recipient || !recipient.revisionRequest) {
    return {
      evaluatorId,
      status: 'pending' as StepApprovalStatus,
      revisionRequestId: null,
      revisionComment: null,
      isCompleted: false,
      completedAt: null,
      responseComment: null,
      requestedAt: null,
      approvedBy: null,
      approvedAt: null,
    };
  }

  const request = recipient.revisionRequest;

  // 2. 재작성 완료 여부에 따라 상태 결정
  let status: StepApprovalStatus;
  if (recipient.isCompleted) {
    status = 'revision_completed' as StepApprovalStatus;
  } else {
    status = 'revision_requested' as StepApprovalStatus;
  }

  return {
    evaluatorId,
    status,
    revisionRequestId: request.id,
    revisionComment: request.comment,
    isCompleted: recipient.isCompleted,
    completedAt: recipient.completedAt,
    responseComment: recipient.responseComment,
    requestedAt: request.requestedAt,
    approvedBy: null,
    approvedAt: null,
  };
}

/**
 * 여러 평가자별 2차 평가 단계 승인 상태를 조회한다 (개선 버전)
 *
 * @param evaluationPeriodId 평가기간 ID
 * @param employeeId 직원 ID
 * @param evaluatorIds 평가자 ID 목록
 * @param mappingId 평가기간-직원 맵핑 ID
 * @param revisionRequestRepository 재작성 요청 Repository
 * @param revisionRequestRecipientRepository 재작성 요청 수신자 Repository
 * @param secondaryStepApprovalRepository 2차 평가자별 단계 승인 Repository
 * @returns 평가자별 재작성 요청 상태 정보 배열
 */
export async function 평가자들별_2차평가_단계승인_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorIds: string[],
  mappingId: string,
  revisionRequestRepository: Repository<EvaluationRevisionRequest>,
  revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>,
  secondaryStepApprovalRepository: Repository<SecondaryEvaluationStepApproval>,
): Promise<EvaluatorRevisionRequestStatus[]> {
  if (evaluatorIds.length === 0) {
    return [];
  }

  // 병렬로 각 평가자별 상태 조회
  const statuses = await Promise.all(
    evaluatorIds.map((evaluatorId) =>
      평가자별_2차평가_단계승인_상태를_조회한다(
        evaluationPeriodId,
        employeeId,
        evaluatorId,
        mappingId,
        revisionRequestRepository,
        revisionRequestRecipientRepository,
        secondaryStepApprovalRepository,
      ),
    ),
  );

  return statuses;
}

/**
 * 자기평가 단계 승인 상태를 조회한다
 *
 * 재작성 요청 테이블에서 자기평가 단계 상태를 조회하여 반환합니다.
 * 자기평가의 경우 피평가자 본인이 수신자가 됩니다.
 *
 * @param evaluationPeriodId 평가기간 ID
 * @param employeeId 직원 ID (피평가자)
 * @param revisionRequestRepository 재작성 요청 Repository
 * @param revisionRequestRecipientRepository 재작성 요청 수신자 Repository
 * @returns 재작성 요청 상태 정보
 */
export async function 자기평가_단계승인_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  revisionRequestRepository: Repository<EvaluationRevisionRequest>,
  revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>,
): Promise<{
  status: StepApprovalStatus;
  revisionRequestId: string | null;
  revisionComment: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
  responseComment: string | null;
  requestedAt: Date | null;
}> {
  // 1. 해당 직원(피평가자)에게 전송된 재작성 요청 조회
  // - 평가기간 ID, 직원 ID, 단계('self'), 수신자 ID로 조회
  const recipient = await revisionRequestRecipientRepository
    .createQueryBuilder('recipient')
    .leftJoinAndSelect('recipient.revisionRequest', 'request')
    .where('request.evaluationPeriodId = :evaluationPeriodId', {
      evaluationPeriodId,
    })
    .andWhere('request.employeeId = :employeeId', { employeeId })
    .andWhere('request.step = :step', { step: 'self' })
    .andWhere('recipient.recipientId = :employeeId', { employeeId })
    .andWhere('recipient.recipientType = :recipientType', {
      recipientType: RecipientType.EVALUATEE,
    })
    .andWhere('recipient.deletedAt IS NULL')
    .andWhere('request.deletedAt IS NULL')
    .orderBy('request.requestedAt', 'DESC')
    .getOne();

  // 재작성 요청이 없으면 기본 상태 반환
  if (!recipient || !recipient.revisionRequest) {
    return {
      status: 'pending' as StepApprovalStatus,
      revisionRequestId: null,
      revisionComment: null,
      isCompleted: false,
      completedAt: null,
      responseComment: null,
      requestedAt: null,
    };
  }

  const request = recipient.revisionRequest;

  // 2. 재작성 완료 여부에 따라 상태 결정
  let status: StepApprovalStatus;
  if (recipient.isCompleted) {
    status = 'revision_completed' as StepApprovalStatus;
  } else {
    status = 'revision_requested' as StepApprovalStatus;
  }

  return {
    status,
    revisionRequestId: request.id,
    revisionComment: request.comment,
    isCompleted: recipient.isCompleted,
    completedAt: recipient.completedAt,
    responseComment: recipient.responseComment,
    requestedAt: request.requestedAt,
  };
}
