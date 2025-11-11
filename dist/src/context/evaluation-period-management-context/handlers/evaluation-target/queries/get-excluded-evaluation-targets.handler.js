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
var GetExcludedEvaluationTargetsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExcludedEvaluationTargetsHandler = exports.GetExcludedEvaluationTargetsQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_service_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
class GetExcludedEvaluationTargetsQuery {
    evaluationPeriodId;
    constructor(evaluationPeriodId) {
        this.evaluationPeriodId = evaluationPeriodId;
    }
}
exports.GetExcludedEvaluationTargetsQuery = GetExcludedEvaluationTargetsQuery;
let GetExcludedEvaluationTargetsHandler = GetExcludedEvaluationTargetsHandler_1 = class GetExcludedEvaluationTargetsHandler {
    evaluationPeriodEmployeeMappingService;
    employeeRepository;
    logger = new common_1.Logger(GetExcludedEvaluationTargetsHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService, employeeRepository) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
        this.employeeRepository = employeeRepository;
    }
    async execute(query) {
        const { evaluationPeriodId } = query;
        this.logger.debug(`평가기간 제외 대상자 조회 - 평가기간: ${evaluationPeriodId}`);
        try {
            const mappings = await this.evaluationPeriodEmployeeMappingService.평가기간의_제외된_대상자를_조회한다(evaluationPeriodId);
            const results = await Promise.all(mappings.map(async (mapping) => {
                const employee = await this.employeeRepository.findOne({
                    where: { id: mapping.employeeId, deletedAt: (0, typeorm_2.IsNull)() },
                });
                return {
                    ...mapping,
                    employee: {
                        id: employee?.id || mapping.employeeId,
                        employeeNumber: employee?.employeeNumber || '',
                        name: employee?.name || '알 수 없음',
                        email: employee?.email || '',
                        departmentName: employee?.departmentName,
                        rankName: employee?.rankName,
                        status: employee?.status || '',
                    },
                };
            }));
            this.logger.debug(`평가기간 제외 대상자 조회 완료 - 평가기간: ${evaluationPeriodId}, 제외 대상자 수: ${results.length}`);
            return results;
        }
        catch (error) {
            this.logger.error(`평가기간 제외 대상자 조회 실패 - 평가기간: ${evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
};
exports.GetExcludedEvaluationTargetsHandler = GetExcludedEvaluationTargetsHandler;
exports.GetExcludedEvaluationTargetsHandler = GetExcludedEvaluationTargetsHandler = GetExcludedEvaluationTargetsHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetExcludedEvaluationTargetsQuery),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService,
        typeorm_2.Repository])
], GetExcludedEvaluationTargetsHandler);
//# sourceMappingURL=get-excluded-evaluation-targets.handler.js.map