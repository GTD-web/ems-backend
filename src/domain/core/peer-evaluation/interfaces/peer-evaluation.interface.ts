import type { PeerEvaluationStatus } from '../peer-evaluation.types';

/**
 * 동료평가 인터페이스
 */
export interface IPeerEvaluation {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 동료평가 내용 */
  evaluationContent?: string;
  /** 동료평가 점수 */
  score?: number;
  /** 평가일 */
  evaluationDate: Date;
  /** 평가 상태 */
  status: PeerEvaluationStatus;
  /** 평가 완료 여부 */
  isCompleted: boolean;
  /** 평가 완료일 */
  completedAt?: Date;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 */
  version: number;
}
