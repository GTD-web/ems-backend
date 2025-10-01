import type { DeliverableStatus, DeliverableType } from '../deliverable.types';

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
  /** 산출물 상태 */
  status: DeliverableStatus;
  /** 예상 완료일 */
  expectedCompletionDate?: Date;
  /** 실제 완료일 */
  actualCompletionDate?: Date;
  /** 파일 경로 */
  filePath?: string;
  /** 파일 크기 (bytes) */
  fileSize?: number;
  /** MIME 타입 */
  mimeType?: string;
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
