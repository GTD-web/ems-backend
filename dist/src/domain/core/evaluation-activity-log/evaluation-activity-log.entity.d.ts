import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationActivityLog } from './interfaces/evaluation-activity-log.interface';
import type { EvaluationActivityLogDto, CreateEvaluationActivityLogData } from './evaluation-activity-log.types';
export declare class EvaluationActivityLog extends BaseEntity<EvaluationActivityLogDto> implements IEvaluationActivityLog {
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
    constructor(data?: CreateEvaluationActivityLogData);
    DTO로_변환한다(): EvaluationActivityLogDto;
}
