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
var CreateEvaluationPeriodWithAutoTargetsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEvaluationPeriodWithAutoTargetsHandler = exports.CreateEvaluationPeriodWithAutoTargetsCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const cqrs_2 = require("@nestjs/cqrs");
const create_evaluation_period_handler_1 = require("./create-evaluation-period.handler");
const register_evaluation_target_with_auto_evaluator_handler_1 = require("../../evaluation-target/commands/register-evaluation-target-with-auto-evaluator.handler");
const get_active_employees_handler_1 = require("../../../../organization-management-context/queries/get-active-employees.handler");
class CreateEvaluationPeriodWithAutoTargetsCommand {
    createData;
    createdBy;
    constructor(createData, createdBy) {
        this.createData = createData;
        this.createdBy = createdBy;
    }
}
exports.CreateEvaluationPeriodWithAutoTargetsCommand = CreateEvaluationPeriodWithAutoTargetsCommand;
let CreateEvaluationPeriodWithAutoTargetsHandler = CreateEvaluationPeriodWithAutoTargetsHandler_1 = class CreateEvaluationPeriodWithAutoTargetsHandler {
    commandBus;
    queryBus;
    logger = new common_1.Logger(CreateEvaluationPeriodWithAutoTargetsHandler_1.name);
    constructor(commandBus, queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    async execute(command) {
        const { createData, createdBy } = command;
        this.logger.log(`평가기간 생성 + 평가 대상자 자동 등록 시작 - 평가기간: ${createData.name}`);
        try {
            const evaluationPeriod = await this.commandBus.execute(new create_evaluation_period_handler_1.CreateEvaluationPeriodCommand(createData, createdBy));
            this.logger.log(`평가기간 생성 완료 - ID: ${evaluationPeriod.id}, 이름: ${evaluationPeriod.name}`);
            const activeEmployees = await this.queryBus.execute(new get_active_employees_handler_1.GetActiveEmployeesQuery(true));
            this.logger.log(`활성 직원 수: ${activeEmployees.length}명 (조회 제외된 직원 포함)`);
            let registeredTargetsCount = 0;
            let autoAssignedEvaluatorsCount = 0;
            const warnings = [];
            for (const employee of activeEmployees) {
                try {
                    this.logger.log(`직원 평가 대상자 등록 시작 - 직원: ${employee.id} (${employee.name})`);
                    const result = await this.commandBus.execute(new register_evaluation_target_with_auto_evaluator_handler_1.RegisterEvaluationTargetWithAutoEvaluatorCommand(evaluationPeriod.id, employee.id, createdBy));
                    this.logger.log(`직원 평가 대상자 등록 완료 - 직원: ${employee.id}, 결과: ${JSON.stringify(result)}`);
                    registeredTargetsCount++;
                    if (result.primaryEvaluatorAssigned) {
                        autoAssignedEvaluatorsCount++;
                    }
                    if (result.warning) {
                        warnings.push(`직원 ${employee.name}(${employee.employeeNumber}): ${result.warning}`);
                    }
                    this.logger.debug(`직원 등록 완료 - ${employee.name}(${employee.employeeNumber}), 평가자 할당: ${result.primaryEvaluatorAssigned}`);
                }
                catch (error) {
                    const warning = `직원 ${employee.name}(${employee.employeeNumber}) 등록 실패: ${error.message}`;
                    warnings.push(warning);
                    this.logger.warn(warning, error.stack);
                }
            }
            const result = {
                evaluationPeriod,
                registeredTargetsCount,
                autoAssignedEvaluatorsCount,
                warnings,
            };
            this.logger.log(`평가기간 생성 + 평가 대상자 자동 등록 완료 - 평가기간: ${evaluationPeriod.name}, ` +
                `등록된 대상자: ${registeredTargetsCount}명, 자동 할당된 평가자: ${autoAssignedEvaluatorsCount}명, ` +
                `경고: ${warnings.length}개`);
            return result;
        }
        catch (error) {
            this.logger.error(`평가기간 생성 + 평가 대상자 자동 등록 실패 - 평가기간: ${createData.name}`, error.stack);
            throw error;
        }
    }
};
exports.CreateEvaluationPeriodWithAutoTargetsHandler = CreateEvaluationPeriodWithAutoTargetsHandler;
exports.CreateEvaluationPeriodWithAutoTargetsHandler = CreateEvaluationPeriodWithAutoTargetsHandler = CreateEvaluationPeriodWithAutoTargetsHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(CreateEvaluationPeriodWithAutoTargetsCommand),
    __metadata("design:paramtypes", [cqrs_2.CommandBus,
        cqrs_2.QueryBus])
], CreateEvaluationPeriodWithAutoTargetsHandler);
//# sourceMappingURL=create-evaluation-period-with-auto-targets.handler.js.map