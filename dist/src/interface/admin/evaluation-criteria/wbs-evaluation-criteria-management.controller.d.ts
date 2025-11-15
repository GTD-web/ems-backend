import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationCriteriaBusinessService } from '@business/evaluation-criteria/evaluation-criteria-business.service';
import { UpsertWbsEvaluationCriteriaBodyDto, WbsEvaluationCriteriaDto, WbsEvaluationCriteriaDetailDto, WbsEvaluationCriteriaFilterDto, WbsItemEvaluationCriteriaResponseDto, WbsEvaluationCriteriaListResponseDto, SubmitEvaluationCriteriaDto, EvaluationCriteriaSubmissionResponseDto } from './dto/wbs-evaluation-criteria.dto';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
export declare class WbsEvaluationCriteriaManagementController {
    private readonly evaluationCriteriaManagementService;
    private readonly evaluationCriteriaBusinessService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, evaluationCriteriaBusinessService: EvaluationCriteriaBusinessService);
    getWbsEvaluationCriteriaList(filter: WbsEvaluationCriteriaFilterDto): Promise<WbsEvaluationCriteriaListResponseDto>;
    getWbsEvaluationCriteriaDetail(id: string): Promise<WbsEvaluationCriteriaDetailDto | null>;
    getWbsItemEvaluationCriteria(wbsItemId: string): Promise<WbsItemEvaluationCriteriaResponseDto>;
    upsertWbsEvaluationCriteria(wbsItemId: string, dto: UpsertWbsEvaluationCriteriaBodyDto, user: AuthenticatedUser): Promise<WbsEvaluationCriteriaDto>;
    deleteWbsEvaluationCriteria(id: string, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    deleteWbsItemEvaluationCriteria(wbsItemId: string, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    submitEvaluationCriteria(dto: SubmitEvaluationCriteriaDto, user: AuthenticatedUser): Promise<EvaluationCriteriaSubmissionResponseDto>;
    resetEvaluationCriteriaSubmission(dto: SubmitEvaluationCriteriaDto, user: AuthenticatedUser): Promise<EvaluationCriteriaSubmissionResponseDto>;
}
