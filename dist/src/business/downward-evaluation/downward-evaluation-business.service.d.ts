import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
export declare class DownwardEvaluationBusinessService {
    private readonly performanceEvaluationService;
    private readonly evaluationCriteriaManagementService;
    private readonly evaluationPeriodManagementContextService;
    private readonly logger;
    constructor(performanceEvaluationService: PerformanceEvaluationService, evaluationCriteriaManagementService: EvaluationCriteriaManagementService, evaluationPeriodManagementContextService: EvaluationPeriodManagementContextService);
    일차_하향평가를_저장한다(params: {
        evaluatorId: string;
        evaluateeId: string;
        periodId: string;
        wbsId: string;
        selfEvaluationId?: string;
        downwardEvaluationContent?: string;
        downwardEvaluationScore?: number;
        actionBy: string;
    }): Promise<string>;
    이차_하향평가를_저장한다(params: {
        evaluatorId: string;
        evaluateeId: string;
        periodId: string;
        wbsId: string;
        selfEvaluationId?: string;
        downwardEvaluationContent?: string;
        downwardEvaluationScore?: number;
        actionBy: string;
    }): Promise<string>;
}
