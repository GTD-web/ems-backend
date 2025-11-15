import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { FinalEvaluationDetailDto, FinalEvaluationFilterDto, FinalEvaluationListResponseDto, FinalEvaluationResponseDto, UpsertFinalEvaluationBodyDto } from '../../common/dto/performance-evaluation/final-evaluation.dto';
export declare class FinalEvaluationManagementController {
    private readonly performanceEvaluationService;
    constructor(performanceEvaluationService: PerformanceEvaluationService);
    upsertFinalEvaluation(employeeId: string, periodId: string, dto: UpsertFinalEvaluationBodyDto, user: AuthenticatedUser): Promise<FinalEvaluationResponseDto>;
    confirmFinalEvaluation(id: string, user: AuthenticatedUser): Promise<{
        message: string;
    }>;
    cancelConfirmationFinalEvaluation(id: string, user: AuthenticatedUser): Promise<{
        message: string;
    }>;
    getFinalEvaluation(id: string): Promise<FinalEvaluationDetailDto>;
    getFinalEvaluationList(filter: FinalEvaluationFilterDto): Promise<FinalEvaluationListResponseDto>;
    getFinalEvaluationByEmployeePeriod(employeeId: string, periodId: string): Promise<FinalEvaluationDetailDto | null>;
}
