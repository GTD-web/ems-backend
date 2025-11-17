import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { EvaluationTargetBusinessService } from '@business/evaluation-target/evaluation-target-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { EmployeeEvaluationPeriodsResponseDto, EvaluationTargetMappingResponseDto, EvaluationTargetStatusResponseDto, EvaluationTargetsResponseDto, ExcludeEvaluationTargetDto, RegisterBulkEvaluationTargetsDto, UnregisteredEmployeesResponseDto } from '@interface/common/dto/evaluation-period/evaluation-target.dto';
export declare class EvaluationTargetController {
    private readonly evaluationPeriodManagementService;
    private readonly evaluationTargetBusinessService;
    constructor(evaluationPeriodManagementService: EvaluationPeriodManagementContextService, evaluationTargetBusinessService: EvaluationTargetBusinessService);
    registerBulkEvaluationTargets(evaluationPeriodId: string, dto: RegisterBulkEvaluationTargetsDto, user: AuthenticatedUser): Promise<EvaluationTargetMappingResponseDto[]>;
    registerEvaluationTarget(evaluationPeriodId: string, employeeId: string, user: AuthenticatedUser): Promise<EvaluationTargetMappingResponseDto>;
    excludeEvaluationTarget(evaluationPeriodId: string, employeeId: string, dto: ExcludeEvaluationTargetDto, user: AuthenticatedUser): Promise<EvaluationTargetMappingResponseDto>;
    includeEvaluationTarget(evaluationPeriodId: string, employeeId: string, user: AuthenticatedUser): Promise<EvaluationTargetMappingResponseDto>;
    getEvaluationTargets(evaluationPeriodId: string, includeExcluded: boolean): Promise<EvaluationTargetsResponseDto>;
    getExcludedEvaluationTargets(evaluationPeriodId: string): Promise<EvaluationTargetsResponseDto>;
    getEmployeeEvaluationPeriods(employeeId: string): Promise<EmployeeEvaluationPeriodsResponseDto>;
    checkEvaluationTarget(evaluationPeriodId: string, employeeId: string): Promise<EvaluationTargetStatusResponseDto>;
    getUnregisteredEmployees(evaluationPeriodId: string): Promise<UnregisteredEmployeesResponseDto>;
    unregisterEvaluationTarget(evaluationPeriodId: string, employeeId: string, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    unregisterAllEvaluationTargets(evaluationPeriodId: string): Promise<{
        deletedCount: number;
    }>;
}
