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
var RegisterBulkEvaluationTargetsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterBulkEvaluationTargetsHandler = exports.RegisterBulkEvaluationTargetsCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_service_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
class RegisterBulkEvaluationTargetsCommand {
    evaluationPeriodId;
    employeeIds;
    createdBy;
    constructor(evaluationPeriodId, employeeIds, createdBy) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.employeeIds = employeeIds;
        this.createdBy = createdBy;
    }
}
exports.RegisterBulkEvaluationTargetsCommand = RegisterBulkEvaluationTargetsCommand;
let RegisterBulkEvaluationTargetsHandler = RegisterBulkEvaluationTargetsHandler_1 = class RegisterBulkEvaluationTargetsHandler {
    evaluationPeriodEmployeeMappingService;
    evaluationPeriodRepository;
    employeeRepository;
    logger = new common_1.Logger(RegisterBulkEvaluationTargetsHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService, evaluationPeriodRepository, employeeRepository) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.employeeRepository = employeeRepository;
    }
    async execute(command) {
        const { evaluationPeriodId, employeeIds, createdBy } = command;
        this.logger.log(`평가 대상자 대량 등록 시작 - 평가기간: ${evaluationPeriodId}, 직원 수: ${employeeIds.length}`);
        try {
            const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
                where: { id: evaluationPeriodId },
            });
            if (!evaluationPeriod) {
                throw new common_1.NotFoundException(`평가기간을 찾을 수 없습니다: ${evaluationPeriodId}`);
            }
            const uniqueEmployeeIds = Array.from(new Set(employeeIds));
            const employees = await this.employeeRepository.find({
                where: { id: (0, typeorm_2.In)(uniqueEmployeeIds) },
            });
            if (employees.length !== uniqueEmployeeIds.length) {
                const foundIds = new Set(employees.map((e) => e.id));
                const notFoundIds = uniqueEmployeeIds.filter((id) => !foundIds.has(id));
                throw new common_1.NotFoundException(`다음 직원을 찾을 수 없습니다: ${notFoundIds.join(', ')}`);
            }
            const results = await this.evaluationPeriodEmployeeMappingService.평가대상자를_대량_등록한다(evaluationPeriodId, employeeIds, createdBy);
            this.logger.log(`평가 대상자 대량 등록 완료 - 평가기간: ${evaluationPeriodId}, 등록 수: ${results.length}`);
            return results;
        }
        catch (error) {
            this.logger.error(`평가 대상자 대량 등록 실패 - 평가기간: ${evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
};
exports.RegisterBulkEvaluationTargetsHandler = RegisterBulkEvaluationTargetsHandler;
exports.RegisterBulkEvaluationTargetsHandler = RegisterBulkEvaluationTargetsHandler = RegisterBulkEvaluationTargetsHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(RegisterBulkEvaluationTargetsCommand),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(2, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RegisterBulkEvaluationTargetsHandler);
//# sourceMappingURL=register-bulk-evaluation-targets.handler.js.map