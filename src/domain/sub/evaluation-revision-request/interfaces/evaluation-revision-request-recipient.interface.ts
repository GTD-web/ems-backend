import type { RecipientType, EvaluationRevisionRequestRecipientDto } from '../evaluation-revision-request.types';

/**
 * 재작성 요청 수신자 인터페이스
 */
export interface IEvaluationRevisionRequestRecipient {
  id: string;
  revisionRequestId: string;
  recipientId: string;
  recipientType: RecipientType;
  isRead: boolean;
  readAt: Date | null;
  isCompleted: boolean;
  completedAt: Date | null;
  responseComment: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 메서드
  읽음처리한다(): void;
  읽지않음으로_변경한다(): void;
  읽음상태인가(): boolean;
  재작성완료_응답한다(responseComment: string): void;
  재작성완료_응답을_취소한다(): void;
  특정수신자의_요청인가(recipientId: string): boolean;
  DTO로_변환한다(): EvaluationRevisionRequestRecipientDto;
}


