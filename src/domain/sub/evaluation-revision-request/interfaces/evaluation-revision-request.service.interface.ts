import type { EvaluationRevisionRequest } from '../evaluation-revision-request.entity';
import type { EvaluationRevisionRequestRecipient } from '../evaluation-revision-request-recipient.entity';
import type {
  CreateRevisionRequestData,
  RevisionRequestFilter,
  RevisionRequestRecipientFilter,
} from '../evaluation-revision-request.types';

/**
 * 재작성 요청 서비스 인터페이스
 */
export interface IEvaluationRevisionRequestService {
  /**
   * ID로 재작성 요청을 조회한다
   */
  ID로_조회한다(id: string): Promise<EvaluationRevisionRequest | null>;

  /**
   * 필터로 재작성 요청 목록을 조회한다
   */
  필터로_조회한다(filter: RevisionRequestFilter): Promise<EvaluationRevisionRequest[]>;

  /**
   * 재작성 요청을 생성한다
   */
  생성한다(data: CreateRevisionRequestData): Promise<EvaluationRevisionRequest>;

  /**
   * 재작성 요청을 저장한다
   */
  저장한다(request: EvaluationRevisionRequest): Promise<EvaluationRevisionRequest>;

  /**
   * 재작성 요청을 삭제한다
   */
  삭제한다(id: string, deletedBy: string): Promise<void>;

  /**
   * 수신자 ID로 재작성 요청 수신자 목록을 조회한다
   */
  수신자의_요청목록을_조회한다(
    recipientId: string,
    filter?: RevisionRequestRecipientFilter,
  ): Promise<EvaluationRevisionRequestRecipient[]>;

  /**
   * 재작성 요청 수신자를 조회한다
   */
  수신자를_조회한다(
    requestId: string,
    recipientId: string,
  ): Promise<EvaluationRevisionRequestRecipient | null>;

  /**
   * 재작성 요청 수신자를 저장한다
   */
  수신자를_저장한다(
    recipient: EvaluationRevisionRequestRecipient,
  ): Promise<EvaluationRevisionRequestRecipient>;

  /**
   * 읽지 않은 재작성 요청 수를 조회한다
   */
  읽지않은_요청수를_조회한다(recipientId: string): Promise<number>;
}



