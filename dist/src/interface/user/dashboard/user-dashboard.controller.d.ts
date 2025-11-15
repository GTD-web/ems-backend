import { DashboardService } from '../../../context/dashboard-context/dashboard.service';
import { EmployeeAssignedDataResponseDto } from './dto/employee-assigned-data.dto';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
export declare class UserDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getMyAssignedData(evaluationPeriodId: string, user: AuthenticatedUser): Promise<EmployeeAssignedDataResponseDto>;
    private 이차_하향평가_정보를_제거한다;
}
