import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { EvaluationActivityLogListResponseDto } from '@interface/common/dto/evaluation-activity-log/evaluation-activity-log-response.dto';
import { GetEvaluationActivityLogListQueryDto } from '@interface/common/dto/evaluation-activity-log/get-evaluation-activity-log-list-query.dto';
export declare class EvaluatorEvaluationActivityLogController {
    private readonly activityLogContextService;
    constructor(activityLogContextService: EvaluationActivityLogContextService);
    getEvaluationActivityLogs(periodId: string, employeeId: string, query: GetEvaluationActivityLogListQueryDto): Promise<EvaluationActivityLogListResponseDto>;
}
