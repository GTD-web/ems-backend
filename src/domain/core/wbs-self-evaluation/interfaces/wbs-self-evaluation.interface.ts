/**
 * WBS 자가평가 인터페이스
 */
export interface IWbsSelfEvaluation {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가일 */
  evaluationDate: Date;
  /** 성과 입력 (실제 달성한 성과 및 결과) */
  performanceResult?: string;
  /** 자가평가 내용 */
  selfEvaluationContent?: string;
  /** 자가평가 점수 (0 ~ maxSelfEvaluationRate) */
  selfEvaluationScore?: number;
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
