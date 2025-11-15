import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { UpsertWbsEvaluationCriteriaBodyDto, WbsEvaluationCriteriaDto } from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';
export declare class UserWbsEvaluationCriteriaManagementController {
    private readonly evaluationCriteriaManagementService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService);
    upsertWbsEvaluationCriteria(wbsItemId: string, dto: UpsertWbsEvaluationCriteriaBodyDto, user: AuthenticatedUser): Promise<WbsEvaluationCriteriaDto>;
}
