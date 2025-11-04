import type {
  RevisionRequestStepType,
  EvaluationRevisionRequestDto,
  RecipientType,
} from '../evaluation-revision-request.types';
import type { EvaluationRevisionRequestRecipient } from '../evaluation-revision-request-recipient.entity';

/**
 * 재작성 요청 인터페이스
 */
export interface IEvaluationRevisionRequest {
  id: string;
  evaluationPeriodId: string;
  employeeId: string;
  step: RevisionRequestStepType;
  comment: string;
  requestedBy: string;
  requestedAt: Date;
  recipients: EvaluationRevisionRequestRecipient[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 메서드
  수신자를_추가한다(recipientId: string, recipientType: RecipientType, createdBy: string): void;
  DTO로_변환한다(): EvaluationRevisionRequestDto;
}



