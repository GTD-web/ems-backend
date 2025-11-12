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
var GetEmployeeEvaluationPeriodsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEmployeeEvaluationPeriodsHandler = exports.GetEmployeeEvaluationPeriodsQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_service_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_period_types_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.types");
class GetEmployeeEvaluationPeriodsQuery {
    employeeId;
    constructor(employeeId) {
        this.employeeId = employeeId;
    }
}
exports.GetEmployeeEvaluationPeriodsQuery = GetEmployeeEvaluationPeriodsQuery;
let GetEmployeeEvaluationPeriodsHandler = GetEmployeeEvaluationPeriodsHandler_1 = class GetEmployeeEvaluationPeriodsHandler {
    evaluationPeriodEmployeeMappingService;
    employeeRepository;
    evaluationPeriodRepository;
    logger = new common_1.Logger(GetEmployeeEvaluationPeriodsHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService, employeeRepository, evaluationPeriodRepository) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
        this.employeeRepository = employeeRepository;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
    }
    async execute(query) {
        const { employeeId } = query;
        this.logger.debug(`직원 평가기간 맵핑 조회 - 직원: ${employeeId}`);
        try {
            const mappings = await this.evaluationPeriodEmployeeMappingService.직원의_평가기간_맵핑을_조회한다(employeeId);
            if (mappings.length === 0) {
                this.logger.debug(`직원 평가기간 맵핑 조회 완료 - 직원: ${employeeId}, 평가기간 수: 0`);
                return [];
            }
            const employee = await this.employeeRepository.findOne({
                where: { id: employeeId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            const periodIds = mappings.map((m) => m.evaluationPeriodId);
            const periods = await this.evaluationPeriodRepository.find({
                where: {
                    id: (0, typeorm_2.In)(periodIds),
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            const periodMap = new Map(periods.map((p) => [p.id, p]));
            const results = mappings.map((mapping) => {
                const period = periodMap.get(mapping.evaluationPeriodId);
                const { evaluationPeriodId, employeeId: _, ...mappingWithoutIds } = mapping;
                return {
                    ...mappingWithoutIds,
                    employee: {
                        id: employee?.id || employeeId,
                        employeeNumber: employee?.employeeNumber || '',
                        name: employee?.name || '알 수 없음',
                        email: employee?.email || '',
                        departmentName: employee?.departmentName,
                        rankName: employee?.rankName,
                        status: employee?.status || '',
                    },
                    evaluationPeriod: {
                        id: period?.id || evaluationPeriodId,
                        name: period?.name || '알 수 없음',
                        startDate: period?.startDate || new Date(),
                        status: period?.status || evaluation_period_types_1.EvaluationPeriodStatus.WAITING,
                        currentPhase: period?.currentPhase || null,
                    },
                };
            });
            this.logger.debug(`직원 평가기간 맵핑 조회 완료 - 직원: ${employeeId}, 평가기간 수: ${results.length}`);
            return results;
        }
        catch (error) {
            this.logger.error(`직원 평가기간 맵핑 조회 실패 - 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
};
exports.GetEmployeeEvaluationPeriodsHandler = GetEmployeeEvaluationPeriodsHandler;
exports.GetEmployeeEvaluationPeriodsHandler = GetEmployeeEvaluationPeriodsHandler = GetEmployeeEvaluationPeriodsHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetEmployeeEvaluationPeriodsQuery),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GetEmployeeEvaluationPeriodsHandler);
//# sourceMappingURL=get-employee-evaluation-periods.handler.js.map