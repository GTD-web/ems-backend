import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { ClearAllWbsSelfEvaluationsResponseDto, ClearWbsSelfEvaluationsByProjectResponseDto, CreateWbsSelfEvaluationBodyDto, SubmitAllWbsSelfEvaluationsResponseDto, SubmitWbsSelfEvaluationsByProjectResponseDto, WbsSelfEvaluationResponseDto } from './dto/wbs-self-evaluation.dto';
export declare class UserWbsSelfEvaluationManagementController {
    private readonly performanceEvaluationService;
    private readonly wbsSelfEvaluationBusinessService;
    constructor(performanceEvaluationService: PerformanceEvaluationService, wbsSelfEvaluationBusinessService: WbsSelfEvaluationBusinessService);
    upsertWbsSelfEvaluation(employeeId: string, wbsItemId: string, periodId: string, dto: CreateWbsSelfEvaluationBodyDto, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    submitWbsSelfEvaluationToEvaluator(id: string, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<SubmitAllWbsSelfEvaluationsResponseDto>;
    submitWbsSelfEvaluationsToEvaluatorByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<SubmitWbsSelfEvaluationsByProjectResponseDto>;
    clearWbsSelfEvaluation(id: string, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    clearAllWbsSelfEvaluationsByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<ClearAllWbsSelfEvaluationsResponseDto>;
    clearWbsSelfEvaluationsByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<ClearWbsSelfEvaluationsByProjectResponseDto>;
}
