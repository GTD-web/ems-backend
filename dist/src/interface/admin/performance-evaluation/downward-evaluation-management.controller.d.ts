import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { DownwardEvaluationBusinessService } from '@business/downward-evaluation/downward-evaluation-business.service';
import { CreatePrimaryDownwardEvaluationBodyDto, CreateSecondaryDownwardEvaluationBodyDto, DownwardEvaluationDetailResponseDto, DownwardEvaluationFilterDto, DownwardEvaluationListResponseDto, DownwardEvaluationResponseDto, SubmitDownwardEvaluationDto } from './dto/downward-evaluation.dto';
import { BulkSubmitDownwardEvaluationQueryDto } from './dto/bulk-submit-downward-evaluation-query.dto';
export declare class DownwardEvaluationManagementController {
    private readonly performanceEvaluationService;
    private readonly downwardEvaluationBusinessService;
    constructor(performanceEvaluationService: PerformanceEvaluationService, downwardEvaluationBusinessService: DownwardEvaluationBusinessService);
    upsertPrimaryDownwardEvaluation(evaluateeId: string, periodId: string, wbsId: string, dto: CreatePrimaryDownwardEvaluationBodyDto, user: AuthenticatedUser): Promise<DownwardEvaluationResponseDto>;
    upsertSecondaryDownwardEvaluation(evaluateeId: string, periodId: string, wbsId: string, dto: CreateSecondaryDownwardEvaluationBodyDto, user: AuthenticatedUser): Promise<DownwardEvaluationResponseDto>;
    submitPrimaryDownwardEvaluation(evaluateeId: string, periodId: string, wbsId: string, submitDto: SubmitDownwardEvaluationDto, user: AuthenticatedUser): Promise<void>;
    submitSecondaryDownwardEvaluation(evaluateeId: string, periodId: string, wbsId: string, submitDto: SubmitDownwardEvaluationDto, user: AuthenticatedUser): Promise<void>;
    resetPrimaryDownwardEvaluation(evaluateeId: string, periodId: string, wbsId: string, submitDto: SubmitDownwardEvaluationDto, user: AuthenticatedUser): Promise<void>;
    resetSecondaryDownwardEvaluation(evaluateeId: string, periodId: string, wbsId: string, submitDto: SubmitDownwardEvaluationDto, user: AuthenticatedUser): Promise<void>;
    submitDownwardEvaluation(id: string, user: AuthenticatedUser): Promise<void>;
    bulkSubmitDownwardEvaluations(evaluateeId: string, periodId: string, queryDto: BulkSubmitDownwardEvaluationQueryDto, submitDto: SubmitDownwardEvaluationDto, user: AuthenticatedUser): Promise<{
        submittedCount: number;
        skippedCount: number;
        failedCount: number;
        submittedIds: string[];
        skippedIds: string[];
        failedItems: Array<{
            evaluationId: string;
            error: string;
        }>;
    }>;
    bulkResetDownwardEvaluations(evaluateeId: string, periodId: string, queryDto: BulkSubmitDownwardEvaluationQueryDto, submitDto: SubmitDownwardEvaluationDto, user: AuthenticatedUser): Promise<{
        resetCount: number;
        skippedCount: number;
        failedCount: number;
        resetIds: string[];
        skippedIds: string[];
        failedItems: Array<{
            evaluationId: string;
            error: string;
        }>;
    }>;
    getEvaluatorDownwardEvaluations(evaluatorId: string, filter: DownwardEvaluationFilterDto): Promise<DownwardEvaluationListResponseDto>;
    getDownwardEvaluationDetail(id: string): Promise<DownwardEvaluationDetailResponseDto>;
}
