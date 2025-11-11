import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import type { AuthenticatedUser } from '@interface/decorators';
import { ClearAllWbsSelfEvaluationsResponseDto, ClearWbsSelfEvaluationsByProjectResponseDto, CreateWbsSelfEvaluationBodyDto, EmployeeSelfEvaluationsResponseDto, ResetAllWbsSelfEvaluationsResponseDto, ResetWbsSelfEvaluationsByProjectResponseDto, SubmitAllWbsSelfEvaluationsResponseDto, SubmitWbsSelfEvaluationsByProjectResponseDto, WbsSelfEvaluationDetailResponseDto, WbsSelfEvaluationFilterDto, WbsSelfEvaluationResponseDto } from './dto/wbs-self-evaluation.dto';
export declare class WbsSelfEvaluationManagementController {
    private readonly performanceEvaluationService;
    constructor(performanceEvaluationService: PerformanceEvaluationService);
    upsertWbsSelfEvaluation(employeeId: string, wbsItemId: string, periodId: string, dto: CreateWbsSelfEvaluationBodyDto, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    submitWbsSelfEvaluation(id: string, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    submitWbsSelfEvaluationToEvaluator(id: string, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    submitAllWbsSelfEvaluationsByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<SubmitAllWbsSelfEvaluationsResponseDto>;
    submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<SubmitAllWbsSelfEvaluationsResponseDto>;
    resetWbsSelfEvaluation(id: string, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    resetAllWbsSelfEvaluationsByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<ResetAllWbsSelfEvaluationsResponseDto>;
    submitWbsSelfEvaluationsByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<SubmitWbsSelfEvaluationsByProjectResponseDto>;
    submitWbsSelfEvaluationsToEvaluatorByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<SubmitWbsSelfEvaluationsByProjectResponseDto>;
    resetWbsSelfEvaluationsByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<ResetWbsSelfEvaluationsByProjectResponseDto>;
    resetWbsSelfEvaluationToEvaluator(id: string, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    resetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<ResetAllWbsSelfEvaluationsResponseDto>;
    resetWbsSelfEvaluationsToEvaluatorByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<ResetWbsSelfEvaluationsByProjectResponseDto>;
    getEmployeeSelfEvaluations(employeeId: string, filter: WbsSelfEvaluationFilterDto): Promise<EmployeeSelfEvaluationsResponseDto>;
    getWbsSelfEvaluationDetail(id: string): Promise<WbsSelfEvaluationDetailResponseDto>;
    clearWbsSelfEvaluation(id: string, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    clearAllWbsSelfEvaluationsByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<ClearAllWbsSelfEvaluationsResponseDto>;
    clearWbsSelfEvaluationsByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<ClearWbsSelfEvaluationsByProjectResponseDto>;
}
