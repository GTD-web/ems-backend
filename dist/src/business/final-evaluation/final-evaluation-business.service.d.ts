import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
export declare class FinalEvaluationBusinessService {
    private readonly performanceEvaluationService;
    private readonly activityLogContextService;
    private readonly logger;
    constructor(performanceEvaluationService: PerformanceEvaluationService, activityLogContextService: EvaluationActivityLogContextService);
    최종평가를_저장한다(employeeId: string, periodId: string, evaluationGrade: string, jobGrade: any, jobDetailedGrade: any, finalComments: string | undefined, actionBy: string): Promise<string>;
}
