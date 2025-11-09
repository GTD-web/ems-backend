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
var RegisterEvaluationTargetWithAutoEvaluatorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterEvaluationTargetWithAutoEvaluatorHandler = exports.RegisterEvaluationTargetWithAutoEvaluatorCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const cqrs_2 = require("@nestjs/cqrs");
const register_evaluation_target_handler_1 = require("./register-evaluation-target.handler");
const configure_primary_evaluator_handler_1 = require("../../../../evaluation-criteria-management-context/handlers/evaluation-line/commands/configure-primary-evaluator.handler");
const find_department_manager_handler_1 = require("../../../../organization-management-context/queries/find-department-manager.handler");
class RegisterEvaluationTargetWithAutoEvaluatorCommand {
    evaluationPeriodId;
    employeeId;
    createdBy;
    constructor(evaluationPeriodId, employeeId, createdBy) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.employeeId = employeeId;
        this.createdBy = createdBy;
    }
}
exports.RegisterEvaluationTargetWithAutoEvaluatorCommand = RegisterEvaluationTargetWithAutoEvaluatorCommand;
let RegisterEvaluationTargetWithAutoEvaluatorHandler = RegisterEvaluationTargetWithAutoEvaluatorHandler_1 = class RegisterEvaluationTargetWithAutoEvaluatorHandler {
    commandBus;
    queryBus;
    logger = new common_1.Logger(RegisterEvaluationTargetWithAutoEvaluatorHandler_1.name);
    constructor(commandBus, queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    async execute(command) {
        const { evaluationPeriodId, employeeId, createdBy } = command;
        this.logger.log(`평가 대상자 등록 + 1차 평가자 자동 할당 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        try {
            const mapping = await this.commandBus.execute(new register_evaluation_target_handler_1.RegisterEvaluationTargetCommand(evaluationPeriodId, employeeId, createdBy));
            this.logger.log(`평가 대상자 등록 완료 - 직원: ${employeeId}`);
            this.logger.log(`부서장 조회 시작 - 직원: ${employeeId}`);
            const departmentManagerId = await this.queryBus.execute(new find_department_manager_handler_1.FindDepartmentManagerQuery(employeeId));
            this.logger.log(`부서장 조회 결과 - 직원: ${employeeId}, 부서장: ${departmentManagerId}`);
            let primaryEvaluatorAssigned = false;
            let primaryEvaluatorId = null;
            let warning = null;
            if (departmentManagerId) {
                try {
                    await this.commandBus.execute(new configure_primary_evaluator_handler_1.ConfigurePrimaryEvaluatorCommand(employeeId, evaluationPeriodId, departmentManagerId, createdBy));
                    primaryEvaluatorAssigned = true;
                    primaryEvaluatorId = departmentManagerId;
                    this.logger.log(`1차 평가자 자동 할당 성공 - 직원: ${employeeId}, 평가자: ${departmentManagerId}`);
                }
                catch (error) {
                    this.logger.warn(`1차 평가자 자동 할당 실패 - 직원: ${employeeId}, 평가자: ${departmentManagerId}`, error.message);
                    warning = `1차 평가자 자동 할당 실패: ${error.message}`;
                }
            }
            else {
                warning = `부서장을 찾을 수 없어 1차 평가자를 할당할 수 없습니다`;
                this.logger.warn(`부서장을 찾을 수 없음 - 직원: ${employeeId}`);
            }
            const result = {
                mapping,
                primaryEvaluatorAssigned,
                primaryEvaluatorId,
                warning,
            };
            this.logger.log(`평가 대상자 등록 + 1차 평가자 자동 할당 완료 - 직원: ${employeeId}, 평가자 할당: ${primaryEvaluatorAssigned}`);
            return result;
        }
        catch (error) {
            this.logger.error(`평가 대상자 등록 + 1차 평가자 자동 할당 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
};
exports.RegisterEvaluationTargetWithAutoEvaluatorHandler = RegisterEvaluationTargetWithAutoEvaluatorHandler;
exports.RegisterEvaluationTargetWithAutoEvaluatorHandler = RegisterEvaluationTargetWithAutoEvaluatorHandler = RegisterEvaluationTargetWithAutoEvaluatorHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(RegisterEvaluationTargetWithAutoEvaluatorCommand),
    __metadata("design:paramtypes", [cqrs_2.CommandBus,
        cqrs_2.QueryBus])
], RegisterEvaluationTargetWithAutoEvaluatorHandler);
//# sourceMappingURL=register-evaluation-target-with-auto-evaluator.handler.js.map