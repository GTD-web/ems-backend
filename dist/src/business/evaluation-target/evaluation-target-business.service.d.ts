import { EvaluationPeriodManagementContextService } from '../../context/evaluation-period-management-context/evaluation-period-management.service';
import { RegisterWithAutoEvaluatorResult } from '../../context/evaluation-period-management-context/handlers/evaluation-target/commands/register-evaluation-target-with-auto-evaluator.handler';
import { EvaluationLineMappingService } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
export declare class EvaluationTargetBusinessService {
    private readonly evaluationPeriodManagementService;
    private readonly evaluationLineMappingService;
    private readonly logger;
    constructor(evaluationPeriodManagementService: EvaluationPeriodManagementContextService, evaluationLineMappingService: EvaluationLineMappingService);
    평가대상자를_등록한다(evaluationPeriodId: string, employeeId: string, createdBy: string): Promise<RegisterWithAutoEvaluatorResult>;
    평가대상자를_대량_등록한다(evaluationPeriodId: string, employeeIds: string[], createdBy: string): Promise<RegisterWithAutoEvaluatorResult[]>;
    평가대상자_등록_해제한다(evaluationPeriodId: string, employeeId: string, deletedBy: string): Promise<boolean>;
}
