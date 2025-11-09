import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { UpsertWbsEvaluationCriteriaBodyDto, WbsEvaluationCriteriaDto, WbsEvaluationCriteriaDetailDto, WbsEvaluationCriteriaFilterDto, WbsItemEvaluationCriteriaResponseDto, WbsEvaluationCriteriaListResponseDto } from './dto/wbs-evaluation-criteria.dto';
import type { AuthenticatedUser } from '../../decorators';
export declare class WbsEvaluationCriteriaManagementController {
    private readonly evaluationCriteriaManagementService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService);
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
}
