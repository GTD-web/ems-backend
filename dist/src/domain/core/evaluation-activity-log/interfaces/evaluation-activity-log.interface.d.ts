import type { IBaseEntity } from '@libs/database/base/base.entity';
import type { EvaluationActivityLogDto } from '../evaluation-activity-log.types';
export interface IEvaluationActivityLog extends IBaseEntity<EvaluationActivityLogDto> {
    periodId: string;
    employeeId: string;
    activityType: string;
    activityAction: string;
    activityTitle?: string;
    activityDescription?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    performedBy: string;
    performedByName?: string;
    activityMetadata?: Record<string, any>;
    activityDate: Date;
}
