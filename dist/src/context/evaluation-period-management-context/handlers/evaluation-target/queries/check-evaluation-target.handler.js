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
var CheckEvaluationTargetHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckEvaluationTargetHandler = exports.CheckEvaluationTargetQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_service_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const evaluation_period_types_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.types");
class CheckEvaluationTargetQuery {
    evaluationPeriodId;
    employeeId;
    constructor(evaluationPeriodId, employeeId) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.employeeId = employeeId;
    }
}
exports.CheckEvaluationTargetQuery = CheckEvaluationTargetQuery;
let CheckEvaluationTargetHandler = CheckEvaluationTargetHandler_1 = class CheckEvaluationTargetHandler {
    evaluationPeriodEmployeeMappingService;
    evaluationPeriodRepository;
    employeeRepository;
    logger = new common_1.Logger(CheckEvaluationTargetHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService, evaluationPeriodRepository, employeeRepository) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.employeeRepository = employeeRepository;
    }
    async execute(query) {
        const { evaluationPeriodId, employeeId } = query;
        this.logger.debug(`평가 대상 여부 확인 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        try {
            const isTarget = await this.evaluationPeriodEmployeeMappingService.평가대상_여부를_확인한다(evaluationPeriodId, employeeId);
            const period = await this.evaluationPeriodRepository.findOne({
                where: { id: evaluationPeriodId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            const employee = await this.employeeRepository.findOne({
                where: { id: employeeId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            this.logger.debug(`평가 대상 여부 확인 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 결과: ${isTarget}`);
            return {
                isEvaluationTarget: isTarget,
                evaluationPeriod: {
                    id: period?.id || evaluationPeriodId,
                    name: period?.name || '알 수 없음',
                    startDate: period?.startDate || new Date(),
                    endDate: period?.endDate || null,
                    status: period?.status || evaluation_period_types_1.EvaluationPeriodStatus.WAITING,
                    currentPhase: period?.currentPhase || null,
                },
                employee: {
                    id: employee?.id || employeeId,
                    employeeNumber: employee?.employeeNumber || '',
                    name: employee?.name || '알 수 없음',
                    email: employee?.email || '',
                    departmentName: employee?.departmentName,
                    rankName: employee?.rankName,
                    status: employee?.status || '',
                },
            };
        }
        catch (error) {
            this.logger.error(`평가 대상 여부 확인 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
};
exports.CheckEvaluationTargetHandler = CheckEvaluationTargetHandler;
exports.CheckEvaluationTargetHandler = CheckEvaluationTargetHandler = CheckEvaluationTargetHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(CheckEvaluationTargetQuery),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(2, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CheckEvaluationTargetHandler);
//# sourceMappingURL=check-evaluation-target.handler.js.map