/**
 * WBS 자가평가 매핑 인터페이스
 */
export interface IWbsSelfEvaluationMapping {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당일 */
  assignedDate: Date;
  /** 할당자 ID */
  assignedBy: string;
  /** 자가평가 완료 여부 */
  isCompleted: boolean;
  /** 완료일 */
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
