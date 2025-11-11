import { Repository, IsNull } from 'typeorm';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
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
}

/**
 * 평가자별 2차 평가 단계 승인 상태를 조회한다
 * 
 * 재작성 요청 테이블에서 평가자별 상태를 조회하여 반환합니다.
 * 
 * @param evaluationPeriodId 평가기간 ID
 * @param employeeId 직원 ID
 * @param evaluatorId 평가자 ID
 * @param revisionRequestRepository 재작성 요청 Repository
 * @param revisionRequestRecipientRepository 재작성 요청 수신자 Repository
 * @returns 평가자별 재작성 요청 상태 정보
 */
export async function 평가자별_2차평가_단계승인_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorId: string,
  revisionRequestRepository: Repository<EvaluationRevisionRequest>,
  revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>,
): Promise<EvaluatorRevisionRequestStatus> {
  // 1. 해당 평가자에게 전송된 재작성 요청 조회
  // - 평가기간 ID, 직원 ID, 단계('secondary'), 수신자 ID로 조회
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
  };
}

/**
 * 여러 평가자별 2차 평가 단계 승인 상태를 조회한다
 * 
 * @param evaluationPeriodId 평가기간 ID
 * @param employeeId 직원 ID
 * @param evaluatorIds 평가자 ID 목록
 * @param revisionRequestRepository 재작성 요청 Repository
 * @param revisionRequestRecipientRepository 재작성 요청 수신자 Repository
 * @returns 평가자별 재작성 요청 상태 정보 배열
 */
export async function 평가자들별_2차평가_단계승인_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorIds: string[],
  revisionRequestRepository: Repository<EvaluationRevisionRequest>,
  revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>,
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
        revisionRequestRepository,
        revisionRequestRecipientRepository,
      ),
    ),
  );

  return statuses;
}

