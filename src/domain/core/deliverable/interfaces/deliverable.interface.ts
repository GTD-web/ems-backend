import type { DeliverableType } from '../deliverable.types';

/**
 * 산출물 인터페이스
 */
export interface IDeliverable {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 산출물명 */
  name: string;
  /** 산출물 설명 */
  description?: string;
  /** 산출물 유형 */
  type: DeliverableType;
  /** 파일 경로 */
  filePath?: string;
  /** 직원 ID */
  employeeId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 매핑일 */
  mappedDate?: Date;
  /** 매핑자 ID */
  mappedBy?: string;
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
