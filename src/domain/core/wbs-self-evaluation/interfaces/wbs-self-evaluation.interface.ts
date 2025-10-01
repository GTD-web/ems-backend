/**
 * WBS 자가평가 인터페이스
 */
export interface IWbsSelfEvaluation {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 평가일 */
  evaluationDate: Date;
  /** 자가평가 내용 */
  selfEvaluationContent: string;
  /** 자가평가 점수 (1-5) */
  selfEvaluationScore: number;
  /** 추가 의견 */
  additionalComments?: string;
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
