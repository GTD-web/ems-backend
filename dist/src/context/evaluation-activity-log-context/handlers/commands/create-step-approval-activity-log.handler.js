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
var CreateStepApprovalActivityLogHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateStepApprovalActivityLogHandler = exports.단계승인활동내역을생성한다 = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const employee_evaluation_step_approval_1 = require("../../../../domain/sub/employee-evaluation-step-approval");
const create_evaluation_activity_log_handler_1 = require("./create-evaluation-activity-log.handler");
class 단계승인활동내역을생성한다 {
    evaluationPeriodId;
    employeeId;
    step;
    status;
    updatedBy;
    revisionComment;
    evaluatorId;
    constructor(evaluationPeriodId, employeeId, step, status, updatedBy, revisionComment, evaluatorId) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.employeeId = employeeId;
        this.step = step;
        this.status = status;
        this.updatedBy = updatedBy;
        this.revisionComment = revisionComment;
        this.evaluatorId = evaluatorId;
    }
}
exports.단계승인활동내역을생성한다 = 단계승인활동내역을생성한다;
let CreateStepApprovalActivityLogHandler = CreateStepApprovalActivityLogHandler_1 = class CreateStepApprovalActivityLogHandler {
    commandBus;
    logger = new common_1.Logger(CreateStepApprovalActivityLogHandler_1.name);
    constructor(commandBus) {
        this.commandBus = commandBus;
    }
    async execute(command) {
        this.logger.log('단계 승인 상태 변경 활동 내역 기록 시작', {
            evaluationPeriodId: command.evaluationPeriodId,
            employeeId: command.employeeId,
            step: command.step,
            status: command.status,
        });
        let activityTitle = '';
        let activityAction = 'approved';
        switch (command.step) {
            case 'criteria':
                activityTitle = '평가기준 설정';
                break;
            case 'self':
                activityTitle = '자기평가';
                break;
            case 'primary':
                activityTitle = '1차 하향평가';
                break;
            case 'secondary':
                activityTitle = '2차 하향평가';
                break;
            default:
                activityTitle = '단계 승인';
        }
        if (command.status === employee_evaluation_step_approval_1.StepApprovalStatus.APPROVED) {
            activityAction = 'approved';
            activityTitle += ' 승인';
        }
        else if (command.status === employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_REQUESTED) {
            activityAction = 'revision_requested';
            activityTitle += ' 재작성 요청';
        }
        else {
            this.logger.log('기록하지 않는 상태입니다', {
                status: command.status,
            });
            throw new Error(`기록하지 않는 상태입니다: ${command.status}`);
        }
        return await this.commandBus.execute(new create_evaluation_activity_log_handler_1.평가활동내역을생성한다(command.evaluationPeriodId, command.employeeId, 'step_approval', activityAction, activityTitle, undefined, 'step_approval', undefined, command.updatedBy, undefined, {
            step: command.step,
            status: command.status,
            revisionComment: command.revisionComment,
            evaluatorId: command.evaluatorId,
        }));
    }
};
exports.CreateStepApprovalActivityLogHandler = CreateStepApprovalActivityLogHandler;
exports.CreateStepApprovalActivityLogHandler = CreateStepApprovalActivityLogHandler = CreateStepApprovalActivityLogHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(단계승인활동내역을생성한다),
    __metadata("design:paramtypes", [cqrs_1.CommandBus])
], CreateStepApprovalActivityLogHandler);
//# sourceMappingURL=create-step-approval-activity-log.handler.js.map