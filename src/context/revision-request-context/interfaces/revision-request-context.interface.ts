import type {
  EvaluationRevisionRequestDto,
  EvaluationRevisionRequestRecipientDto,
  RevisionRequestStepType,
} from '@domain/sub/evaluation-revision-request';
import type { RecipientType } from '@domain/sub/evaluation-revision-request';
import type { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';

/**
 * 재작성 요청 응답 DTO (수신자 정보 포함)
 */
export interface RevisionRequestWithDetailsDto {
  /** 재작성 요청 정보 */
  request: EvaluationRevisionRequestDto;
  /** 수신자 정보 */
  recipientInfo: EvaluationRevisionRequestRecipientDto;
  /** 피평가자 정보 */
  employee: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName?: string;
    rankName?: string;
  };
  /** 평가기간 정보 */
  evaluationPeriod: {
    id: string;
    name: string;
  };
  /** 단계 승인 상태 */
  approvalStatus: StepApprovalStatus;
}

/**
 * 재작성 요청 필터
 */
export interface GetRevisionRequestsFilter {
  /** 평가기간 ID */
  evaluationPeriodId?: string;
  /** 피평가자 ID (관리자용) */
  employeeId?: string;
  /** 요청자 ID (관리자용) */
  requestedBy?: string;
  /** 읽음 여부 */
  isRead?: boolean;
  /** 완료 여부 */
  isCompleted?: boolean;
  /** 단계 */
  step?: RevisionRequestStepType;
}

/**
 * 재작성 요청 컨텍스트 인터페이스
 */
export interface IRevisionRequestContext {
  /**
   * 전체 재작성 요청 목록을 조회한다 (관리자용)
   */
  전체_재작성요청목록을_조회한다(
    filter?: GetRevisionRequestsFilter,
  ): Promise<RevisionRequestWithDetailsDto[]>;

  /**
   * 내 재작성 요청 목록을 조회한다
   */
  내_재작성요청목록을_조회한다(
    recipientId: string,
    filter?: GetRevisionRequestsFilter,
  ): Promise<RevisionRequestWithDetailsDto[]>;

  /**
   * 읽지 않은 재작성 요청 수를 조회한다
   */
  읽지않은_재작성요청수를_조회한다(recipientId: string): Promise<number>;

  /**
   * 재작성 요청을 읽음 처리한다
   */
  재작성요청을_읽음처리한다(
    requestId: string,
    recipientId: string,
  ): Promise<void>;

  /**
   * 재작성 완료 응답을 제출한다
   */
  재작성완료_응답을_제출한다(
    requestId: string,
    recipientId: string,
    responseComment: string,
  ): Promise<void>;

  /**
   * 평가기간, 직원, 평가자 기반으로 재작성 완료 응답을 제출한다 (관리자용)
   */
  평가기간_직원_평가자로_재작성완료_응답을_제출한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    step: RevisionRequestStepType,
    responseComment: string,
  ): Promise<void>;

  /**
   * 제출자에게 요청된 재작성 요청을 자동 완료 처리한다
   * 
   * 평가 제출 시 해당 제출자에게 전송된 재작성 요청이 존재하면 자동으로 완료 처리합니다.
   * 비즈니스 서비스에서 선언적으로 사용할 수 있도록 제공되는 함수입니다.
   */
  제출자에게_요청된_재작성요청을_완료처리한다(
    evaluationPeriodId: string,
    employeeId: string,
    step: RevisionRequestStepType,
    recipientId: string,
    recipientType: RecipientType,
    responseComment: string,
  ): Promise<void>;
}



