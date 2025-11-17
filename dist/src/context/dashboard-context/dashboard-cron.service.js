"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DashboardCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardCronService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const dashboard_service_1 = require("./dashboard.service");
let DashboardCronService = DashboardCronService_1 = class DashboardCronService {
    dashboardService;
    configService;
    logger = new common_1.Logger(DashboardCronService_1.name);
    constructor(dashboardService, configService) {
        this.dashboardService = dashboardService;
        this.configService = configService;
    }
    async refreshDashboardData() {
        const isVercel = !!this.configService.get('VERCEL');
        if (isVercel) {
            this.logger.log('대시보드 데이터 갱신 크론 작업을 시작합니다 (Vercel)...');
        }
        else {
            this.logger.log('대시보드 데이터 갱신 크론 작업을 시작합니다 (로컬)...');
        }
        try {
            this.logger.log('대시보드 데이터 갱신 크론 작업이 완료되었습니다.');
        }
        catch (error) {
            this.logger.error('대시보드 데이터 갱신 크론 작업 중 오류 발생:', error);
            throw error;
        }
    }
    async triggerRefreshDashboardData() {
        this.logger.log('수동 대시보드 데이터 갱신을 시작합니다...');
        try {
            await this.refreshDashboardData();
            return {
                success: true,
                message: '대시보드 데이터 갱신이 완료되었습니다.',
            };
        }
        catch (error) {
            this.logger.error('수동 대시보드 데이터 갱신 실패:', error);
            throw error;
        }
    }
};
exports.DashboardCronService = DashboardCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardCronService.prototype, "refreshDashboardData", null);
exports.DashboardCronService = DashboardCronService = DashboardCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        config_1.ConfigService])
], DashboardCronService);
//# sourceMappingURL=dashboard-cron.service.js.map