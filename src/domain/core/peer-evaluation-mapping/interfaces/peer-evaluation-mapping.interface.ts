/**
 * 동료평가 매핑 인터페이스
 */
export interface IPeerEvaluationMapping {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 동료평가 ID */
  peerEvaluationId: string;
  /** 매핑일 */
  mappedDate: Date;
  /** 매핑자 ID */
  mappedBy: string;
  /** 활성 상태 */
  isActive: boolean;
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
