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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDashboardController = void 0;
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("../../../context/dashboard-context/dashboard.service");
const dashboard_api_decorators_1 = require("./decorators/dashboard-api.decorators");
let UserDashboardController = class UserDashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getEmployeeAssignedData(evaluationPeriodId, employeeId) {
        return await this.dashboardService.사용자_할당_정보를_조회한다(evaluationPeriodId, employeeId);
    }
};
exports.UserDashboardController = UserDashboardController;
__decorate([
    (0, dashboard_api_decorators_1.GetEmployeeAssignedData)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserDashboardController.prototype, "getEmployeeAssignedData", null);
exports.UserDashboardController = UserDashboardController = __decorate([
    (0, swagger_1.ApiTags)('A-0-2. 관리자 - 대시보드'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('user/dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], UserDashboardController);
//# sourceMappingURL=dashboard.controller.js.map