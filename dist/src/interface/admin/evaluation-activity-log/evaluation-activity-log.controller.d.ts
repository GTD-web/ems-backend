import { QueryBus } from '@nestjs/cqrs';
import { EvaluationActivityLogListResponseDto } from '@interface/common/dto/evaluation-activity-log/evaluation-activity-log-response.dto';
import { GetEvaluationActivityLogListQueryDto } from '@interface/common/dto/evaluation-activity-log/get-evaluation-activity-log-list-query.dto';
export declare class EvaluationActivityLogController {
    private readonly queryBus;
    constructor(queryBus: QueryBus);
    getEvaluationActivityLogs(periodId: string, employeeId: string, query: GetEvaluationActivityLogListQueryDto): Promise<EvaluationActivityLogListResponseDto>;
}
