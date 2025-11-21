import { IQueryHandler } from '@nestjs/cqrs';
import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';
import type { GetEvaluationActivityLogListResult } from '../../interfaces/evaluation-activity-log-context.interface';
export declare class 평가활동내역목록을조회한다 {
    readonly periodId: string;
    readonly employeeId: string;
    readonly activityType?: string | undefined;
    readonly startDate?: Date | undefined;
    readonly endDate?: Date | undefined;
    readonly page: number;
    readonly limit: number;
    constructor(periodId: string, employeeId: string, activityType?: string | undefined, startDate?: Date | undefined, endDate?: Date | undefined, page?: number, limit?: number);
}
export declare class GetEvaluationActivityLogListHandler implements IQueryHandler<평가활동내역목록을조회한다, GetEvaluationActivityLogListResult> {
    private readonly activityLogService;
    private readonly logger;
    constructor(activityLogService: EvaluationActivityLogService);
    execute(query: 평가활동내역목록을조회한다): Promise<GetEvaluationActivityLogListResult>;
}
