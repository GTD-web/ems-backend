import { EvaluationPeriodManagementContextService } from '../../context/evaluation-period-management-context/evaluation-period-management.service';
import { CreateEvaluationPeriodMinimalDto } from '../../context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import { CreateEvaluationPeriodWithTargetsResult } from '../../context/evaluation-period-management-context/handlers/evaluation-period/commands/create-evaluation-period-with-auto-targets.handler';
import { RegisterWithAutoEvaluatorResult } from '../../context/evaluation-period-management-context/handlers/evaluation-target/commands/register-evaluation-target-with-auto-evaluator.handler';
import { EvaluationPeriodPhase } from '../../domain/core/evaluation-period/evaluation-period.types';
import type { EvaluationPeriodDto } from '../../domain/core/evaluation-period/evaluation-period.types';
export declare class EvaluationPeriodBusinessService {
    private readonly evaluationPeriodManagementService;
    private readonly logger;
    constructor(evaluationPeriodManagementService: EvaluationPeriodManagementContextService);
    평가기간을_생성한다(createData: CreateEvaluationPeriodMinimalDto, createdBy: string): Promise<CreateEvaluationPeriodWithTargetsResult>;
    평가대상자를_대량_등록한다(evaluationPeriodId: string, employeeIds: string[], createdBy: string): Promise<RegisterWithAutoEvaluatorResult[]>;
    단계_변경한다(periodId: string, targetPhase: EvaluationPeriodPhase, changedBy: string): Promise<EvaluationPeriodDto>;
    자동_단계_전이를_실행한다(): Promise<number>;
}
