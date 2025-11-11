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
var CreatePeerEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePeerEvaluationHandler = exports.CreatePeerEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_service_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const peer_evaluation_types_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.types");
const employee_service_1 = require("../../../../../domain/common/employee/employee.service");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class CreatePeerEvaluationCommand {
    evaluatorId;
    evaluateeId;
    periodId;
    projectId;
    requestDeadline;
    createdBy;
    constructor(evaluatorId, evaluateeId, periodId, projectId, requestDeadline, createdBy = '시스템') {
        this.evaluatorId = evaluatorId;
        this.evaluateeId = evaluateeId;
        this.periodId = periodId;
        this.projectId = projectId;
        this.requestDeadline = requestDeadline;
        this.createdBy = createdBy;
    }
}
exports.CreatePeerEvaluationCommand = CreatePeerEvaluationCommand;
let CreatePeerEvaluationHandler = CreatePeerEvaluationHandler_1 = class CreatePeerEvaluationHandler {
    peerEvaluationService;
    employeeService;
    evaluationPeriodService;
    transactionManager;
    logger = new common_1.Logger(CreatePeerEvaluationHandler_1.name);
    constructor(peerEvaluationService, employeeService, evaluationPeriodService, transactionManager) {
        this.peerEvaluationService = peerEvaluationService;
        this.employeeService = employeeService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluatorId, evaluateeId, periodId, projectId, requestDeadline, createdBy, } = command;
        this.logger.log('동료평가 생성 핸들러 실행', {
            evaluatorId,
            evaluateeId,
            periodId,
            projectId,
            requestDeadline,
        });
        const evaluator = await this.employeeService.ID로_조회한다(evaluatorId);
        if (!evaluator) {
            throw new common_1.NotFoundException(`평가자를 찾을 수 없습니다. (ID: ${evaluatorId})`);
        }
        const evaluatee = await this.employeeService.ID로_조회한다(evaluateeId);
        if (!evaluatee) {
            throw new common_1.NotFoundException(`피평가자를 찾을 수 없습니다. (ID: ${evaluateeId})`);
        }
        const period = await this.evaluationPeriodService.ID로_조회한다(periodId);
        if (!period) {
            throw new common_1.NotFoundException(`평가기간을 찾을 수 없습니다. (ID: ${periodId})`);
        }
        return await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.peerEvaluationService.생성한다({
                evaluateeId,
                evaluatorId,
                periodId,
                evaluationDate: new Date(),
                requestDeadline,
                status: peer_evaluation_types_1.PeerEvaluationStatus.PENDING,
                isCompleted: false,
                mappedBy: createdBy,
                createdBy,
            });
            this.logger.log('동료평가 생성 완료', { evaluationId: evaluation.id });
            return evaluation.id;
        });
    }
};
exports.CreatePeerEvaluationHandler = CreatePeerEvaluationHandler;
exports.CreatePeerEvaluationHandler = CreatePeerEvaluationHandler = CreatePeerEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreatePeerEvaluationCommand),
    __metadata("design:paramtypes", [peer_evaluation_service_1.PeerEvaluationService,
        employee_service_1.EmployeeService,
        evaluation_period_service_1.EvaluationPeriodService,
        transaction_manager_service_1.TransactionManagerService])
], CreatePeerEvaluationHandler);
//# sourceMappingURL=create-peer-evaluation.handler.js.map