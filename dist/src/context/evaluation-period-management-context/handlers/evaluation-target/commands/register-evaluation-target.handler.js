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
var RegisterEvaluationTargetHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterEvaluationTargetHandler = exports.RegisterEvaluationTargetCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_service_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
class RegisterEvaluationTargetCommand {
    evaluationPeriodId;
    employeeId;
    createdBy;
    constructor(evaluationPeriodId, employeeId, createdBy) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.employeeId = employeeId;
        this.createdBy = createdBy;
    }
}
exports.RegisterEvaluationTargetCommand = RegisterEvaluationTargetCommand;
let RegisterEvaluationTargetHandler = RegisterEvaluationTargetHandler_1 = class RegisterEvaluationTargetHandler {
    evaluationPeriodEmployeeMappingService;
    evaluationPeriodRepository;
    employeeRepository;
    logger = new common_1.Logger(RegisterEvaluationTargetHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService, evaluationPeriodRepository, employeeRepository) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.employeeRepository = employeeRepository;
    }
    async execute(command) {
        const { evaluationPeriodId, employeeId, createdBy } = command;
        this.logger.log(`평가 대상자 등록 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        try {
            const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
                where: { id: evaluationPeriodId },
            });
            if (!evaluationPeriod) {
                throw new common_1.NotFoundException(`평가기간을 찾을 수 없습니다: ${evaluationPeriodId}`);
            }
            const employee = await this.employeeRepository.findOne({
                where: { id: employeeId },
            });
            if (!employee) {
                throw new common_1.NotFoundException(`직원을 찾을 수 없습니다: ${employeeId}`);
            }
            if (employee.status !== '재직중') {
                throw new common_1.BadRequestException(`재직중인 직원만 평가 대상자로 등록할 수 있습니다. 현재 상태: ${employee.status}`);
            }
            let result = await this.evaluationPeriodEmployeeMappingService.평가대상자를_등록한다({
                evaluationPeriodId,
                employeeId,
                createdBy,
            });
            if (employee.isExcludedFromList) {
                this.logger.log(`직원이 조회 제외 목록에 있어 평가 대상에서도 제외 처리 - 직원: ${employeeId}`);
                result = await this.evaluationPeriodEmployeeMappingService.평가대상에서_제외한다(evaluationPeriodId, employeeId, {
                    excludeReason: '조회 제외 목록에 있는 직원',
                    excludedBy: createdBy,
                });
            }
            this.logger.log(`평가 대상자 등록 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 제외 여부: ${result.isExcluded}`);
            return result;
        }
        catch (error) {
            this.logger.error(`평가 대상자 등록 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
};
exports.RegisterEvaluationTargetHandler = RegisterEvaluationTargetHandler;
exports.RegisterEvaluationTargetHandler = RegisterEvaluationTargetHandler = RegisterEvaluationTargetHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(RegisterEvaluationTargetCommand),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(2, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RegisterEvaluationTargetHandler);
//# sourceMappingURL=register-evaluation-target.handler.js.map