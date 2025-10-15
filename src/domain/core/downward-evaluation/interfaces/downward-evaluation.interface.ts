import type { DownwardEvaluationType } from '../downward-evaluation.types';

/**
 * 하향평가 인터페이스
 */
export interface IDownwardEvaluation {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 자기평가 ID */
  selfEvaluationId?: string;
  /** 하향평가 내용 */
  downwardEvaluationContent?: string;
  /** 하향평가 점수 */
  downwardEvaluationScore?: number;
  /** 평가일 */
  evaluationDate: Date;
  /** 평가 유형 */
  evaluationType: DownwardEvaluationType;
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
