import { ConfigService } from '@nestjs/config';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { DepartmentSyncService } from '@context/organization-management-context/department-sync.service';
export declare class CronController {
    private readonly evaluationPeriodAutoPhaseService;
    private readonly employeeSyncService;
    private readonly departmentSyncService;
    private readonly configService;
    private readonly logger;
    constructor(evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService, employeeSyncService: EmployeeSyncService, departmentSyncService: DepartmentSyncService, configService: ConfigService);
    private validateCronSecret;
    triggerEvaluationPeriodAutoPhase(authHeader: string | undefined): Promise<{
        message: string;
        success?: undefined;
        transitionedCount?: undefined;
    } | {
        success: boolean;
        message: string;
        transitionedCount: number;
    }>;
    triggerEmployeeSync(authHeader: string | undefined): Promise<{
        message: string;
        success?: undefined;
    } | {
        success: boolean;
        message: string;
    }>;
    triggerDepartmentSync(authHeader: string | undefined): Promise<{
        message: string;
        success?: undefined;
    } | {
        success: boolean;
        message: string;
    }>;
}
