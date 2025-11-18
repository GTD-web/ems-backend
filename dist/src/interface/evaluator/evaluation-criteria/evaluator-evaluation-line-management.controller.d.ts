import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationLineBusinessService } from '@business/evaluation-line/evaluation-line-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { ConfigureEvaluatorResponseDto, ConfigureSecondaryEvaluatorDto, EvaluatorsByPeriodResponseDto, EvaluatorTypeQueryDto } from '@interface/common/dto/evaluation-criteria/evaluation-line.dto';
export declare class EvaluatorEvaluationLineManagementController {
    private readonly evaluationCriteriaManagementService;
    private readonly evaluationLineBusinessService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, evaluationLineBusinessService: EvaluationLineBusinessService);
    configureSecondaryEvaluator(employeeId: string, wbsItemId: string, periodId: string, dto: ConfigureSecondaryEvaluatorDto, user: AuthenticatedUser): Promise<ConfigureEvaluatorResponseDto>;
    getEvaluatorsByPeriod(periodId: string, query: EvaluatorTypeQueryDto): Promise<EvaluatorsByPeriodResponseDto>;
}
