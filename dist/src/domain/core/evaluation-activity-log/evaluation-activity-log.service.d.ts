import { Repository } from 'typeorm';
import { EvaluationActivityLog } from './evaluation-activity-log.entity';
import type { EvaluationActivityLogDto, CreateEvaluationActivityLogData } from './evaluation-activity-log.types';
export declare class EvaluationActivityLogService {
    private readonly activityLogRepository;
    private readonly logger;
    constructor(activityLogRepository: Repository<EvaluationActivityLog>);
    생성한다(data: CreateEvaluationActivityLogData): Promise<EvaluationActivityLogDto>;
    평가기간_피평가자_활동내역을_조회한다(params: {
        periodId: string;
        employeeId: string;
        activityType?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        items: EvaluationActivityLogDto[];
        total: number;
        page: number;
        limit: number;
    }>;
}
