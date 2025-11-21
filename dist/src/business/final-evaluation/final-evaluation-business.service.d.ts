import { CommandBus } from '@nestjs/cqrs';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
export declare class FinalEvaluationBusinessService {
    private readonly performanceEvaluationService;
    private readonly commandBus;
    private readonly logger;
    constructor(performanceEvaluationService: PerformanceEvaluationService, commandBus: CommandBus);
    최종평가를_저장한다(employeeId: string, periodId: string, evaluationGrade: string, jobGrade: any, jobDetailedGrade: any, finalComments: string | undefined, actionBy: string): Promise<string>;
}
