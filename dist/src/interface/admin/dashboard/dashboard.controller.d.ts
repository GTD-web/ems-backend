import { DashboardService } from '../../../context/dashboard-context/dashboard.service';
import type { AuthenticatedUser } from '../../decorators/current-user.decorator';
import { EvaluationPeriodService } from '../../../domain/core/evaluation-period/evaluation-period.service';
import { EmployeeSyncService } from '../../../context/organization-management-context/employee-sync.service';
import { GetAllEmployeesEvaluationPeriodStatusQueryDto } from './dto/get-all-employees-evaluation-period-status-query.dto';
import { EmployeeEvaluationPeriodStatusResponseDto } from './dto/employee-evaluation-period-status.dto';
import { MyEvaluationTargetStatusResponseDto } from './dto/my-evaluation-targets-status.dto';
import { EmployeeAssignedDataResponseDto, EvaluatorAssignedEmployeesDataResponseDto } from './dto/employee-assigned-data.dto';
import { DashboardFinalEvaluationsByPeriodResponseDto } from './dto/final-evaluation-list.dto';
import { EmployeeFinalEvaluationListResponseDto, GetEmployeeFinalEvaluationsQueryDto } from './dto/employee-final-evaluation-list.dto';
import { AllEmployeesFinalEvaluationsResponseDto, GetAllEmployeesFinalEvaluationsQueryDto } from './dto/all-employees-final-evaluations.dto';
import { EmployeeCompleteStatusResponseDto } from './dto/employee-complete-status.dto';
export declare class DashboardController {
    private readonly dashboardService;
    private readonly evaluationPeriodService;
    private readonly employeeSyncService;
    constructor(dashboardService: DashboardService, evaluationPeriodService: EvaluationPeriodService, employeeSyncService: EmployeeSyncService);
    getAllEmployeesEvaluationPeriodStatus(evaluationPeriodId: string, queryDto: GetAllEmployeesEvaluationPeriodStatusQueryDto): Promise<EmployeeEvaluationPeriodStatusResponseDto[]>;
    getMyEvaluationTargetsStatus(evaluationPeriodId: string, evaluatorId: string): Promise<MyEvaluationTargetStatusResponseDto[]>;
    getEmployeeEvaluationPeriodStatus(evaluationPeriodId: string, employeeId: string): Promise<EmployeeEvaluationPeriodStatusResponseDto | null>;
    getMyAssignedData(evaluationPeriodId: string, user: AuthenticatedUser): Promise<EmployeeAssignedDataResponseDto>;
    getEmployeeAssignedData(evaluationPeriodId: string, employeeId: string): Promise<EmployeeAssignedDataResponseDto>;
    private 이차_하향평가_정보를_제거한다;
    getEvaluatorAssignedEmployeesData(evaluationPeriodId: string, evaluatorId: string, employeeId: string): Promise<EvaluatorAssignedEmployeesDataResponseDto>;
    getFinalEvaluationsByPeriod(evaluationPeriodId: string): Promise<DashboardFinalEvaluationsByPeriodResponseDto>;
    getAllEmployeesFinalEvaluations(queryDto: GetAllEmployeesFinalEvaluationsQueryDto): Promise<AllEmployeesFinalEvaluationsResponseDto>;
    getFinalEvaluationsByEmployee(employeeId: string, queryDto: GetEmployeeFinalEvaluationsQueryDto): Promise<EmployeeFinalEvaluationListResponseDto>;
    getEmployeeCompleteStatus(evaluationPeriodId: string, employeeId: string): Promise<EmployeeCompleteStatusResponseDto>;
}
