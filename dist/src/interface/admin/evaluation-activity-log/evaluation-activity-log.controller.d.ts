import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { EvaluationActivityLogListResponseDto } from './dto/evaluation-activity-log-response.dto';
import { GetEvaluationActivityLogListQueryDto } from './dto/get-evaluation-activity-log-list-query.dto';
export declare class EvaluationActivityLogController {
    private readonly activityLogContextService;
    constructor(activityLogContextService: EvaluationActivityLogContextService);
    getEvaluationActivityLogs(periodId: string, employeeId: string, query: GetEvaluationActivityLogListQueryDto): Promise<EvaluationActivityLogListResponseDto>;
}
