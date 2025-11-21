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
var GetEvaluationActivityLogListHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEvaluationActivityLogListHandler = exports.평가활동내역목록을조회한다 = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_activity_log_service_1 = require("../../../../domain/core/evaluation-activity-log/evaluation-activity-log.service");
class 평가활동내역목록을조회한다 {
    periodId;
    employeeId;
    activityType;
    startDate;
    endDate;
    page;
    limit;
    constructor(periodId, employeeId, activityType, startDate, endDate, page = 1, limit = 10) {
        this.periodId = periodId;
        this.employeeId = employeeId;
        this.activityType = activityType;
        this.startDate = startDate;
        this.endDate = endDate;
        this.page = page;
        this.limit = limit;
    }
}
exports.평가활동내역목록을조회한다 = 평가활동내역목록을조회한다;
let GetEvaluationActivityLogListHandler = GetEvaluationActivityLogListHandler_1 = class GetEvaluationActivityLogListHandler {
    activityLogService;
    logger = new common_1.Logger(GetEvaluationActivityLogListHandler_1.name);
    constructor(activityLogService) {
        this.activityLogService = activityLogService;
    }
    async execute(query) {
        this.logger.log('평가기간 피평가자 활동 내역 조회 시작', {
            periodId: query.periodId,
            employeeId: query.employeeId,
        });
        return await this.activityLogService.평가기간_피평가자_활동내역을_조회한다({
            periodId: query.periodId,
            employeeId: query.employeeId,
            activityType: query.activityType,
            startDate: query.startDate,
            endDate: query.endDate,
            page: query.page,
            limit: query.limit,
        });
    }
};
exports.GetEvaluationActivityLogListHandler = GetEvaluationActivityLogListHandler;
exports.GetEvaluationActivityLogListHandler = GetEvaluationActivityLogListHandler = GetEvaluationActivityLogListHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(평가활동내역목록을조회한다),
    __metadata("design:paramtypes", [evaluation_activity_log_service_1.EvaluationActivityLogService])
], GetEvaluationActivityLogListHandler);
//# sourceMappingURL=get-evaluation-activity-log-list.handler.js.map