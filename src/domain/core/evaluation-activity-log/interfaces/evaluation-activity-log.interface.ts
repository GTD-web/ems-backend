import type { IBaseEntity } from '@libs/database/base/base.entity';
import type { EvaluationActivityLogDto } from '../evaluation-activity-log.types';

/**
 * 평가 활동 내역 인터페이스
 */
export interface IEvaluationActivityLog extends IBaseEntity<EvaluationActivityLogDto> {
  /** 평가 기간 ID */
  periodId: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 활동 유형 */
  activityType: string;
  /** 활동 액션 */
  activityAction: string;
  /** 활동 제목 */
  activityTitle?: string;
  /** 활동 설명 */
  activityDescription?: string;
  /** 관련 엔티티 유형 */
  relatedEntityType?: string;
  /** 관련 엔티티 ID */
  relatedEntityId?: string;
  /** 활동 수행자 ID */
  performedBy: string;
  /** 활동 수행자 이름 */
  performedByName?: string;
  /** 활동 메타데이터 */
  activityMetadata?: Record<string, any>;
  /** 활동 일시 */
  activityDate: Date;
}

