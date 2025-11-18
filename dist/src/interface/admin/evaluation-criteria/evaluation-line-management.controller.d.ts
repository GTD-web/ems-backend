import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationLineBusinessService } from '@business/evaluation-line/evaluation-line-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { BatchConfigurePrimaryEvaluatorDto, BatchConfigurePrimaryEvaluatorResponseDto, BatchConfigureSecondaryEvaluatorDto, BatchConfigureSecondaryEvaluatorResponseDto, ConfigureEvaluatorResponseDto, ConfigurePrimaryEvaluatorDto, ConfigureSecondaryEvaluatorDto, EmployeeEvaluationSettingsResponseDto, EvaluatorEmployeesResponseDto, EvaluatorsByPeriodResponseDto, EvaluatorTypeQueryDto } from '@interface/common/dto/evaluation-criteria/evaluation-line.dto';
export declare class EvaluationLineManagementController {
    private readonly evaluationCriteriaManagementService;
    private readonly evaluationLineBusinessService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, evaluationLineBusinessService: EvaluationLineBusinessService);
    getEvaluatorEmployees(periodId: string, evaluatorId: string): Promise<EvaluatorEmployeesResponseDto>;
    getEmployeeEvaluationSettings(employeeId: string, periodId: string): Promise<EmployeeEvaluationSettingsResponseDto>;
    configurePrimaryEvaluator(employeeId: string, periodId: string, dto: ConfigurePrimaryEvaluatorDto, user: AuthenticatedUser): Promise<ConfigureEvaluatorResponseDto>;
    configureSecondaryEvaluator(employeeId: string, wbsItemId: string, periodId: string, dto: ConfigureSecondaryEvaluatorDto, user: AuthenticatedUser): Promise<ConfigureEvaluatorResponseDto>;
    getEvaluatorsByPeriod(periodId: string, query: EvaluatorTypeQueryDto): Promise<EvaluatorsByPeriodResponseDto>;
    batchConfigurePrimaryEvaluator(periodId: string, dto: BatchConfigurePrimaryEvaluatorDto, user: AuthenticatedUser): Promise<BatchConfigurePrimaryEvaluatorResponseDto>;
    batchConfigureSecondaryEvaluator(periodId: string, dto: BatchConfigureSecondaryEvaluatorDto, user: AuthenticatedUser): Promise<BatchConfigureSecondaryEvaluatorResponseDto>;
}
