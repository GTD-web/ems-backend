import { ConfigService } from '@nestjs/config';
import { DashboardService } from './dashboard.service';
export declare class DashboardCronService {
    private readonly dashboardService;
    private readonly configService;
    private readonly logger;
    constructor(dashboardService: DashboardService, configService: ConfigService);
    refreshDashboardData(): Promise<void>;
    triggerRefreshDashboardData(): Promise<{
        success: boolean;
        message: string;
    }>;
}
