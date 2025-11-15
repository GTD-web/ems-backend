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
var AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler = exports.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_service_1 = require("../../../../../domain/common/employee/employee.service");
const evaluation_period_employee_mapping_service_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
const evaluation_line_service_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.service");
const evaluation_line_mapping_service_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
const evaluation_line_mapping_entity_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
class AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand {
    periodId;
    createdBy;
    constructor(periodId, createdBy) {
        this.periodId = periodId;
        this.createdBy = createdBy;
    }
}
exports.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand = AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand;
let AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler = AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler_1 = class AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler {
    evaluationPeriodEmployeeMappingService;
    employeeService;
    evaluationLineService;
    evaluationLineMappingService;
    dataSource;
    logger = new common_1.Logger(AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService, employeeService, evaluationLineService, evaluationLineMappingService, dataSource) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
        this.employeeService = employeeService;
        this.evaluationLineService = evaluationLineService;
        this.evaluationLineMappingService = evaluationLineMappingService;
        this.dataSource = dataSource;
    }
    async execute(command) {
        const { periodId, createdBy } = command;
        this.logger.log(`평가기간의 모든 직원에 대한 managerId 기반 1차 평가자 자동 구성 시작 - 평가기간: ${periodId}`);
        return await this.dataSource.transaction(async (manager) => {
            try {
                const mappings = await this.evaluationPeriodEmployeeMappingService.평가기간의_평가대상자를_조회한다(periodId, false);
                if (mappings.length === 0) {
                    this.logger.warn(`평가기간에 등록된 직원이 없습니다 - 평가기간: ${periodId}`);
                    return {
                        message: '평가기간에 등록된 직원이 없습니다.',
                        totalEmployees: 0,
                        successCount: 0,
                        skippedCount: 0,
                        failedCount: 0,
                        totalCreatedMappings: 0,
                        results: [],
                    };
                }
                const employeeIds = mappings.map((m) => m.employeeId);
                this.logger.log(`평가기간의 평가 대상자 수: ${employeeIds.length} - 평가기간: ${periodId}`);
                const evaluationLines = await this.evaluationLineService.필터_조회한다({
                    evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
                    orderFrom: 1,
                    orderTo: 1,
                });
                let primaryEvaluationLine;
                if (evaluationLines.length > 0) {
                    primaryEvaluationLine = evaluationLines[0];
                }
                else {
                    primaryEvaluationLine = await this.evaluationLineService.생성한다({
                        evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
                        order: 1,
                        isRequired: true,
                        isAutoAssigned: false,
                    });
                }
                const evaluationLineId = primaryEvaluationLine.DTO로_변환한다().id;
                const employeeDataMap = new Map();
                const results = [];
                let failedCount = 0;
                let skippedCount = 0;
                for (const employeeId of employeeIds) {
                    try {
                        const employee = await this.employeeService.ID로_조회한다(employeeId);
                        if (!employee) {
                            failedCount++;
                            results.push({
                                employeeId,
                                success: false,
                                message: `직원을 찾을 수 없습니다`,
                                createdMappings: 0,
                                error: `직원을 찾을 수 없습니다: ${employeeId}`,
                            });
                            continue;
                        }
                        if (!employee.managerId) {
                            skippedCount++;
                            results.push({
                                employeeId,
                                success: true,
                                message: '직원의 관리자가 설정되지 않아 1차 평가자를 구성할 수 없습니다.',
                                createdMappings: 0,
                            });
                            continue;
                        }
                        const managerEmployee = await this.employeeService.findByExternalId(employee.managerId);
                        if (!managerEmployee) {
                            skippedCount++;
                            results.push({
                                employeeId,
                                success: true,
                                message: `관리자(managerId: ${employee.managerId})를 찾을 수 없어 1차 평가자를 구성할 수 없습니다.`,
                                createdMappings: 0,
                            });
                            continue;
                        }
                        employeeDataMap.set(employeeId, {
                            employeeId,
                            evaluatorId: managerEmployee.id,
                        });
                    }
                    catch (error) {
                        failedCount++;
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this.logger.error(`직원 ${employeeId} 조회 실패`, error.stack);
                        results.push({
                            employeeId,
                            success: false,
                            message: `직원 조회 실패`,
                            createdMappings: 0,
                            error: errorMessage,
                        });
                    }
                }
                const validEmployeeIds = Array.from(employeeDataMap.keys());
                if (validEmployeeIds.length === 0) {
                    this.logger.warn(`1차 평가자를 구성할 수 있는 직원이 없습니다 - 평가기간: ${periodId}`);
                    return {
                        message: `1차 평가자를 구성할 수 있는 직원이 없습니다.`,
                        totalEmployees: employeeIds.length,
                        successCount: 0,
                        skippedCount,
                        failedCount,
                        totalCreatedMappings: 0,
                        results,
                    };
                }
                const mappingRepository = manager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping);
                const existingMappings = await mappingRepository.find({
                    where: {
                        evaluationPeriodId: periodId,
                        employeeId: (0, typeorm_2.In)(validEmployeeIds),
                        evaluationLineId,
                        wbsItemId: (0, typeorm_2.IsNull)(),
                        deletedAt: (0, typeorm_2.IsNull)(),
                    },
                });
                if (existingMappings.length > 0) {
                    const now = new Date();
                    for (const mapping of existingMappings) {
                        mapping.deletedAt = now;
                        mapping.수정자를_설정한다(createdBy);
                    }
                    await mappingRepository.save(existingMappings);
                    this.logger.log(`기존 1차 평가자 매핑 벌크 삭제 완료 - 삭제된 매핑 수: ${existingMappings.length}`);
                }
                const newMappings = validEmployeeIds.map((employeeId) => {
                    const employeeData = employeeDataMap.get(employeeId);
                    const mapping = mappingRepository.create({
                        evaluationPeriodId: periodId,
                        employeeId,
                        evaluatorId: employeeData.evaluatorId,
                        wbsItemId: undefined,
                        evaluationLineId,
                        createdBy,
                    });
                    return mapping;
                });
                const savedMappings = await mappingRepository.save(newMappings);
                this.logger.log(`새 1차 평가자 매핑 벌크 생성 완료 - 생성된 매핑 수: ${savedMappings.length}`);
                const successCount = savedMappings.length;
                const totalCreatedMappings = savedMappings.length;
                for (const employeeId of validEmployeeIds) {
                    results.push({
                        employeeId,
                        success: true,
                        message: `직원 ${employeeId}의 1차 평가자(관리자) 자동 구성이 완료되었습니다.`,
                        createdMappings: 1,
                    });
                }
                this.logger.log(`평가기간의 모든 직원에 대한 managerId 기반 1차 평가자 자동 구성 완료 - 평가기간: ${periodId}, 성공: ${successCount}, 건너뜀: ${skippedCount}, 실패: ${failedCount}`);
                return {
                    message: `평가기간의 모든 직원에 대한 1차 평가자(관리자) 자동 구성이 완료되었습니다.`,
                    totalEmployees: employeeIds.length,
                    successCount,
                    skippedCount,
                    failedCount,
                    totalCreatedMappings,
                    results,
                };
            }
            catch (error) {
                this.logger.error(`평가기간의 모든 직원에 대한 managerId 기반 1차 평가자 자동 구성 실패 - 평가기간: ${periodId}`, error.stack);
                throw error;
            }
        });
    }
};
exports.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler = AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler;
exports.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler = AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler = AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand),
    __param(4, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService,
        employee_service_1.EmployeeService,
        evaluation_line_service_1.EvaluationLineService,
        evaluation_line_mapping_service_1.EvaluationLineMappingService,
        typeorm_2.DataSource])
], AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler);
//# sourceMappingURL=auto-configure-primary-evaluator-by-manager-for-all-employees.handler.js.map