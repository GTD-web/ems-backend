import { WbsItemStatus, WbsItemDto } from './wbs-item.types';

/**
 * WBS 항목 도메인 인터페이스 (평가 시스템 전용)
 *
 * 평가 시스템에서 사용하는 WBS 항목 기능만 정의합니다.
 * 기본적으로는 데이터 접근과 DTO 변환 기능을 제공합니다.
 */
export interface IWbsItem {
  // 기본 속성 (readonly로 엔티티 필드들)
  /** 고유 식별자 */
  readonly id: string;
  /** WBS 코드 */
  readonly wbsCode: string;
  /** WBS 제목 */
  readonly title: string;
  /** WBS 상태 */
  readonly status: WbsItemStatus;
  /** 시작일 */
  readonly startDate?: Date;
  /** 종료일 */
  readonly endDate?: Date;
  /** 진행률 (%) */
  readonly progressPercentage?: number;
  /** 담당자 ID */
  readonly assignedToId?: string;
  /** 프로젝트 ID */
  readonly projectId: string;
  /** 상위 WBS 항목 ID */
  readonly parentWbsId?: string;
  /** WBS 레벨 (1: 최상위) */
  readonly level: number;
}
