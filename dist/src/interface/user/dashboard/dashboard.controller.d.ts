import { DashboardService } from '../../../context/dashboard-context/dashboard.service';
import { EmployeeAssignedDataResponseDto } from './dto/employee-assigned-data.dto';
export declare class UserDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getEmployeeAssignedData(evaluationPeriodId: string, employeeId: string): Promise<EmployeeAssignedDataResponseDto>;
}
