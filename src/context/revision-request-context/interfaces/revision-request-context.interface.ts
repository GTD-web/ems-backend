import type {
  EvaluationRevisionRequestDto,
  EvaluationRevisionRequestRecipientDto,
  RevisionRequestStepType,
} from '@domain/sub/evaluation-revision-request';

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
}


