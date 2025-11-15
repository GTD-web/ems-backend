import { EvaluationCriteriaBusinessService } from '@business/evaluation-criteria/evaluation-criteria-business.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { EvaluationCriteriaSubmissionResponseDto, SubmitEvaluationCriteriaDto, UpsertWbsEvaluationCriteriaBodyDto, WbsEvaluationCriteriaDto } from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';
export declare class EvaluatorWbsEvaluationCriteriaManagementController {
    private readonly evaluationCriteriaManagementService;
    private readonly evaluationCriteriaBusinessService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, evaluationCriteriaBusinessService: EvaluationCriteriaBusinessService);
    upsertWbsEvaluationCriteria(wbsItemId: string, dto: UpsertWbsEvaluationCriteriaBodyDto, user: AuthenticatedUser): Promise<WbsEvaluationCriteriaDto>;
    submitEvaluationCriteria(dto: SubmitEvaluationCriteriaDto, user: AuthenticatedUser): Promise<EvaluationCriteriaSubmissionResponseDto>;
}
