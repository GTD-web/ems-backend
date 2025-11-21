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
var EvaluationLineBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationLineBusinessService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_criteria_management_service_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const handlers_1 = require("../../context/evaluation-activity-log-context/handlers");
let EvaluationLineBusinessService = EvaluationLineBusinessService_1 = class EvaluationLineBusinessService {
    evaluationCriteriaManagementService;
    commandBus;
    logger = new common_1.Logger(EvaluationLineBusinessService_1.name);
    constructor(evaluationCriteriaManagementService, commandBus) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.commandBus = commandBus;
    }
    async 일차_평가자를_구성한다(employeeId, periodId, evaluatorId, createdBy) {
        this.logger.log('1차 평가자 구성 시작', {
            employeeId,
            periodId,
            evaluatorId,
        });
        const result = await this.evaluationCriteriaManagementService.일차_평가자를_구성한다(employeeId, periodId, evaluatorId, createdBy);
        try {
            await this.commandBus.execute(new handlers_1.평가활동내역을생성한다(periodId, employeeId, 'evaluation_line', 'updated', '1차 평가자 구성', undefined, 'evaluation_line_mapping', result.mapping.id, createdBy, undefined, {
                evaluatorId,
                evaluatorType: 'primary',
            }));
        }
        catch (error) {
            this.logger.warn('1차 평가자 구성 활동 내역 기록 실패', {
                employeeId,
                periodId,
                evaluatorId,
                error: error.message,
            });
        }
        this.logger.log('1차 평가자 구성 완료', {
            employeeId,
            evaluatorId,
            mappingId: result.mapping.id,
        });
        return result;
    }
    async 이차_평가자를_구성한다(employeeId, wbsItemId, periodId, evaluatorId, createdBy) {
        this.logger.log('2차 평가자 구성 시작', {
            employeeId,
            wbsItemId,
            periodId,
            evaluatorId,
        });
        const result = await this.evaluationCriteriaManagementService.이차_평가자를_구성한다(employeeId, wbsItemId, periodId, evaluatorId, createdBy);
        try {
            await this.commandBus.execute(new handlers_1.평가활동내역을생성한다(periodId, employeeId, 'evaluation_line', 'updated', '2차 평가자 구성', undefined, 'evaluation_line_mapping', result.mapping.id, createdBy, undefined, {
                evaluatorId,
                evaluatorType: 'secondary',
                wbsItemId,
            }));
        }
        catch (error) {
            this.logger.warn('2차 평가자 구성 활동 내역 기록 실패', {
                employeeId,
                wbsItemId,
                periodId,
                evaluatorId,
                error: error.message,
            });
        }
        this.logger.log('2차 평가자 구성 완료', {
            employeeId,
            wbsItemId,
            evaluatorId,
            mappingId: result.mapping.id,
        });
        return result;
    }
    async 여러_피평가자의_일차_평가자를_일괄_구성한다(periodId, assignments, createdBy) {
        this.logger.log('여러 피평가자의 1차 평가자 일괄 구성 시작', {
            periodId,
            count: assignments.length,
        });
        const result = await this.evaluationCriteriaManagementService.여러_피평가자의_일차_평가자를_일괄_구성한다(periodId, assignments, createdBy);
        await Promise.all(result.results
            .filter((r) => r.status === 'success' && r.mapping)
            .map(async (r) => {
            try {
                await this.commandBus.execute(new handlers_1.평가활동내역을생성한다(periodId, r.employeeId, 'evaluation_line', 'updated', '1차 평가자 구성', undefined, 'evaluation_line_mapping', r.mapping.id, createdBy, undefined, {
                    evaluatorId: r.evaluatorId,
                    evaluatorType: 'primary',
                }));
            }
            catch (error) {
                this.logger.warn('1차 평가자 일괄 구성 활동 내역 기록 실패', {
                    employeeId: r.employeeId,
                    periodId,
                    evaluatorId: r.evaluatorId,
                    error: error.message,
                });
            }
        }));
        this.logger.log('여러 피평가자의 1차 평가자 일괄 구성 완료', {
            periodId,
            totalCount: result.totalCount,
            successCount: result.successCount,
            failureCount: result.failureCount,
        });
        return result;
    }
    async 여러_피평가자의_이차_평가자를_일괄_구성한다(periodId, assignments, createdBy) {
        this.logger.log('여러 피평가자의 2차 평가자 일괄 구성 시작', {
            periodId,
            count: assignments.length,
        });
        const result = await this.evaluationCriteriaManagementService.여러_피평가자의_이차_평가자를_일괄_구성한다(periodId, assignments, createdBy);
        await Promise.all(result.results
            .filter((r) => r.status === 'success' && r.mapping)
            .map(async (r) => {
            try {
                await this.commandBus.execute(new handlers_1.평가활동내역을생성한다(periodId, r.employeeId, 'evaluation_line', 'updated', '2차 평가자 구성', undefined, 'evaluation_line_mapping', r.mapping.id, createdBy, undefined, {
                    evaluatorId: r.evaluatorId,
                    evaluatorType: 'secondary',
                    wbsItemId: r.wbsItemId,
                }));
            }
            catch (error) {
                this.logger.warn('2차 평가자 일괄 구성 활동 내역 기록 실패', {
                    employeeId: r.employeeId,
                    wbsItemId: r.wbsItemId,
                    periodId,
                    evaluatorId: r.evaluatorId,
                    error: error.message,
                });
            }
        }));
        this.logger.log('여러 피평가자의 2차 평가자 일괄 구성 완료', {
            periodId,
            totalCount: result.totalCount,
            successCount: result.successCount,
            failureCount: result.failureCount,
        });
        return result;
    }
};
exports.EvaluationLineBusinessService = EvaluationLineBusinessService;
exports.EvaluationLineBusinessService = EvaluationLineBusinessService = EvaluationLineBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        cqrs_1.CommandBus])
], EvaluationLineBusinessService);
//# sourceMappingURL=evaluation-line-business.service.js.map