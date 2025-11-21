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
var CreateRevisionCompletedActivityLogHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRevisionCompletedActivityLogHandler = exports.재작성완료활동내역을생성한다 = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const create_evaluation_activity_log_handler_1 = require("./create-evaluation-activity-log.handler");
class 재작성완료활동내역을생성한다 {
    evaluationPeriodId;
    employeeId;
    step;
    requestId;
    performedBy;
    responseComment;
    allCompleted;
    constructor(evaluationPeriodId, employeeId, step, requestId, performedBy, responseComment, allCompleted) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.employeeId = employeeId;
        this.step = step;
        this.requestId = requestId;
        this.performedBy = performedBy;
        this.responseComment = responseComment;
        this.allCompleted = allCompleted;
    }
}
exports.재작성완료활동내역을생성한다 = 재작성완료활동내역을생성한다;
let CreateRevisionCompletedActivityLogHandler = CreateRevisionCompletedActivityLogHandler_1 = class CreateRevisionCompletedActivityLogHandler {
    commandBus;
    logger = new common_1.Logger(CreateRevisionCompletedActivityLogHandler_1.name);
    constructor(commandBus) {
        this.commandBus = commandBus;
    }
    async execute(command) {
        this.logger.log('재작성 완료 활동 내역 기록 시작', {
            evaluationPeriodId: command.evaluationPeriodId,
            employeeId: command.employeeId,
            step: command.step,
            requestId: command.requestId,
        });
        let activityTitle = '';
        switch (command.step) {
            case 'criteria':
                activityTitle = '평가기준 설정 재작성 완료';
                break;
            case 'self':
                activityTitle = '자기평가 재작성 완료';
                break;
            case 'primary':
                activityTitle = '1차 하향평가 재작성 완료';
                break;
            case 'secondary':
                activityTitle = '2차 하향평가 재작성 완료';
                break;
            default:
                activityTitle = '재작성 완료';
        }
        return await this.commandBus.execute(new create_evaluation_activity_log_handler_1.평가활동내역을생성한다(command.evaluationPeriodId, command.employeeId, 'revision_request', 'revision_completed', activityTitle, undefined, 'revision_request', command.requestId, command.performedBy, undefined, {
            step: command.step,
            responseComment: command.responseComment,
            allCompleted: command.allCompleted,
        }));
    }
};
exports.CreateRevisionCompletedActivityLogHandler = CreateRevisionCompletedActivityLogHandler;
exports.CreateRevisionCompletedActivityLogHandler = CreateRevisionCompletedActivityLogHandler = CreateRevisionCompletedActivityLogHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(재작성완료활동내역을생성한다),
    __metadata("design:paramtypes", [cqrs_1.CommandBus])
], CreateRevisionCompletedActivityLogHandler);
//# sourceMappingURL=create-revision-completed-activity-log.handler.js.map