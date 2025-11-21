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
var CreateEvaluationActivityLogHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEvaluationActivityLogHandler = exports.평가활동내역을생성한다 = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_activity_log_service_1 = require("../../../../domain/core/evaluation-activity-log/evaluation-activity-log.service");
const employee_service_1 = require("../../../../domain/common/employee/employee.service");
class 평가활동내역을생성한다 {
    periodId;
    employeeId;
    activityType;
    activityAction;
    activityTitle;
    activityDescription;
    relatedEntityType;
    relatedEntityId;
    performedBy;
    performedByName;
    activityMetadata;
    activityDate;
    constructor(periodId, employeeId, activityType, activityAction, activityTitle, activityDescription, relatedEntityType, relatedEntityId, performedBy, performedByName, activityMetadata, activityDate) {
        this.periodId = periodId;
        this.employeeId = employeeId;
        this.activityType = activityType;
        this.activityAction = activityAction;
        this.activityTitle = activityTitle;
        this.activityDescription = activityDescription;
        this.relatedEntityType = relatedEntityType;
        this.relatedEntityId = relatedEntityId;
        this.performedBy = performedBy;
        this.performedByName = performedByName;
        this.activityMetadata = activityMetadata;
        this.activityDate = activityDate;
    }
}
exports.평가활동내역을생성한다 = 평가활동내역을생성한다;
let CreateEvaluationActivityLogHandler = CreateEvaluationActivityLogHandler_1 = class CreateEvaluationActivityLogHandler {
    activityLogService;
    employeeService;
    logger = new common_1.Logger(CreateEvaluationActivityLogHandler_1.name);
    constructor(activityLogService, employeeService) {
        this.activityLogService = activityLogService;
        this.employeeService = employeeService;
    }
    async execute(command) {
        this.logger.log('활동 내역 기록 시작', {
            periodId: command.periodId,
            employeeId: command.employeeId,
            activityType: command.activityType,
        });
        let performedByName = command.performedByName;
        if (!performedByName && command.performedBy) {
            try {
                const employee = await this.employeeService.ID로_조회한다(command.performedBy);
                if (employee) {
                    performedByName = employee.name;
                }
            }
            catch (error) {
                this.logger.warn('활동 수행자 이름 조회 실패', {
                    performedBy: command.performedBy,
                    error: error.message,
                });
            }
        }
        let activityDescription = command.activityDescription;
        if (!activityDescription && performedByName && command.activityTitle) {
            const actionText = this.액션을_텍스트로_변환한다(command.activityAction);
            const objectName = this.객체명을_추출한다(command.activityTitle, actionText);
            const particle = this.조사를_결정한다(objectName);
            activityDescription = `${performedByName}님이 ${objectName}${particle} ${actionText}했습니다.`;
        }
        const result = await this.activityLogService.생성한다({
            periodId: command.periodId,
            employeeId: command.employeeId,
            activityType: command.activityType,
            activityAction: command.activityAction,
            activityTitle: command.activityTitle,
            activityDescription,
            relatedEntityType: command.relatedEntityType,
            relatedEntityId: command.relatedEntityId,
            performedBy: command.performedBy || '',
            performedByName,
            activityMetadata: command.activityMetadata,
            activityDate: command.activityDate,
        });
        this.logger.log('활동 내역 기록 완료', { id: result.id });
        return result;
    }
    액션을_텍스트로_변환한다(action) {
        const actionMap = {
            created: '생성',
            updated: '수정',
            submitted: '제출',
            completed: '완료',
            cancelled: '취소',
            deleted: '삭제',
            assigned: '할당',
            unassigned: '할당 해제',
            approved: '승인',
            rejected: '거부',
            revision_requested: '재작성 요청',
            revision_completed: '재작성 완료',
        };
        return actionMap[action] || action;
    }
    객체명을_추출한다(activityTitle, actionText) {
        let objectName = activityTitle;
        if (objectName.includes(actionText)) {
            objectName = objectName
                .replace(new RegExp(`\\s*${actionText}\\s*`), '')
                .trim();
        }
        objectName = objectName.replace(/\s*\([^)]*\)\s*/g, '').trim();
        return objectName || activityTitle;
    }
    조사를_결정한다(text) {
        if (!text)
            return '를';
        const lastChar = text[text.length - 1];
        const lastCharCode = lastChar.charCodeAt(0);
        if (lastCharCode >= 0xac00 && lastCharCode <= 0xd7a3) {
            const hasBatchim = (lastCharCode - 0xac00) % 28 !== 0;
            return hasBatchim ? '을' : '를';
        }
        return '를';
    }
};
exports.CreateEvaluationActivityLogHandler = CreateEvaluationActivityLogHandler;
exports.CreateEvaluationActivityLogHandler = CreateEvaluationActivityLogHandler = CreateEvaluationActivityLogHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(평가활동내역을생성한다),
    __metadata("design:paramtypes", [evaluation_activity_log_service_1.EvaluationActivityLogService,
        employee_service_1.EmployeeService])
], CreateEvaluationActivityLogHandler);
//# sourceMappingURL=create-evaluation-activity-log.handler.js.map