import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { DepartmentSyncService } from '@context/organization-management-context/department-sync.service';
export declare class CronController {
    private readonly evaluationPeriodAutoPhaseService;
    private readonly evaluationPeriodService;
    private readonly employeeSyncService;
    private readonly departmentSyncService;
    private readonly logger;
    constructor(evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService, evaluationPeriodService: EvaluationPeriodService, employeeSyncService: EmployeeSyncService, departmentSyncService: DepartmentSyncService);
    private get koreaTime();
    private toKoreaDayjs;
    triggerEvaluationPeriodAutoPhase(): Promise<{
        success: boolean;
        message: string;
        transitionedCount: number;
    }>;
    triggerEmployeeSync(): Promise<{
        success: boolean;
        message: string;
    }>;
    triggerDepartmentSync(): Promise<{
        success: boolean;
        message: string;
    }>;
}
