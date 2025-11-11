import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '../../decorators/current-user.decorator';
import { ConfigureEvaluatorResponseDto, ConfigurePrimaryEvaluatorDto, ConfigureSecondaryEvaluatorDto, EmployeeEvaluationSettingsResponseDto, EvaluatorEmployeesResponseDto, EvaluatorsByPeriodResponseDto, EvaluatorTypeQueryDto, BatchConfigurePrimaryEvaluatorDto, BatchConfigurePrimaryEvaluatorResponseDto, BatchConfigureSecondaryEvaluatorDto, BatchConfigureSecondaryEvaluatorResponseDto } from './dto/evaluation-line.dto';
export declare class EvaluationLineManagementController {
    private readonly evaluationCriteriaManagementService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService);
    getEvaluatorEmployees(periodId: string, evaluatorId: string): Promise<EvaluatorEmployeesResponseDto>;
    getEmployeeEvaluationSettings(employeeId: string, periodId: string): Promise<EmployeeEvaluationSettingsResponseDto>;
    configurePrimaryEvaluator(employeeId: string, periodId: string, dto: ConfigurePrimaryEvaluatorDto, user: AuthenticatedUser): Promise<ConfigureEvaluatorResponseDto>;
    configureSecondaryEvaluator(employeeId: string, wbsItemId: string, periodId: string, dto: ConfigureSecondaryEvaluatorDto, user: AuthenticatedUser): Promise<ConfigureEvaluatorResponseDto>;
    getEvaluatorsByPeriod(periodId: string, query: EvaluatorTypeQueryDto): Promise<EvaluatorsByPeriodResponseDto>;
    batchConfigurePrimaryEvaluator(periodId: string, dto: BatchConfigurePrimaryEvaluatorDto, user: AuthenticatedUser): Promise<BatchConfigurePrimaryEvaluatorResponseDto>;
    batchConfigureSecondaryEvaluator(periodId: string, dto: BatchConfigureSecondaryEvaluatorDto, user: AuthenticatedUser): Promise<BatchConfigureSecondaryEvaluatorResponseDto>;
}
