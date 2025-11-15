import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { EmployeeEvaluationPeriodsResponseDto, EvaluationTargetMappingResponseDto, EvaluationTargetStatusResponseDto, EvaluationTargetsResponseDto, ExcludeEvaluationTargetDto, GetEvaluationTargetsQueryDto, RegisterBulkEvaluationTargetsDto } from '../../common/dto/evaluation-period/evaluation-target.dto';
export declare class EvaluationTargetController {
    private readonly evaluationPeriodManagementService;
    constructor(evaluationPeriodManagementService: EvaluationPeriodManagementContextService);
    registerBulkEvaluationTargets(evaluationPeriodId: string, dto: RegisterBulkEvaluationTargetsDto, user: AuthenticatedUser): Promise<EvaluationTargetMappingResponseDto[]>;
    registerEvaluationTarget(evaluationPeriodId: string, employeeId: string, user: AuthenticatedUser): Promise<EvaluationTargetMappingResponseDto>;
    excludeEvaluationTarget(evaluationPeriodId: string, employeeId: string, dto: ExcludeEvaluationTargetDto, user: AuthenticatedUser): Promise<EvaluationTargetMappingResponseDto>;
    includeEvaluationTarget(evaluationPeriodId: string, employeeId: string, user: AuthenticatedUser): Promise<EvaluationTargetMappingResponseDto>;
    getEvaluationTargets(evaluationPeriodId: string, query: GetEvaluationTargetsQueryDto): Promise<EvaluationTargetsResponseDto>;
    getExcludedEvaluationTargets(evaluationPeriodId: string): Promise<EvaluationTargetsResponseDto>;
    getEmployeeEvaluationPeriods(employeeId: string): Promise<EmployeeEvaluationPeriodsResponseDto>;
    checkEvaluationTarget(evaluationPeriodId: string, employeeId: string): Promise<EvaluationTargetStatusResponseDto>;
    unregisterEvaluationTarget(evaluationPeriodId: string, employeeId: string): Promise<{
        success: boolean;
    }>;
    unregisterAllEvaluationTargets(evaluationPeriodId: string): Promise<{
        deletedCount: number;
    }>;
}
