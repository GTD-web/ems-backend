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
var Phase2EvaluationPeriodGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase2EvaluationPeriodGenerator = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const faker_1 = require("@faker-js/faker");
const evaluation_period_entity_1 = require("../../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const types_1 = require("../types");
const utils_1 = require("../utils");
const evaluation_period_types_1 = require("../../../domain/core/evaluation-period/evaluation-period.types");
const BATCH_SIZE = 500;
let Phase2EvaluationPeriodGenerator = Phase2EvaluationPeriodGenerator_1 = class Phase2EvaluationPeriodGenerator {
    periodRepository;
    mappingRepository;
    logger = new common_1.Logger(Phase2EvaluationPeriodGenerator_1.name);
    constructor(periodRepository, mappingRepository) {
        this.periodRepository = periodRepository;
        this.mappingRepository = mappingRepository;
    }
    async generate(config, phase1Result) {
        const startTime = Date.now();
        const dist = {
            ...types_1.DEFAULT_STATE_DISTRIBUTION,
            ...config.stateDistribution,
        };
        this.logger.log('Phase 2 시작: 평가기간 데이터 생성');
        const employeeIds = phase1Result.generatedIds.employeeIds;
        const systemAdminId = phase1Result.generatedIds.systemAdminId;
        const periodCount = config.evaluationConfig?.periodCount || 1;
        const periodIds = await this.생성_평가기간들(periodCount, dist, systemAdminId);
        this.logger.log(`생성 완료: EvaluationPeriod ${periodIds.length}개`);
        const mappingIds = await this.생성_평가대상자_매핑들(periodIds, employeeIds, dist, systemAdminId);
        this.logger.log(`생성 완료: EvaluationPeriodEmployeeMapping ${mappingIds.length}개`);
        const duration = Date.now() - startTime;
        this.logger.log(`Phase 2 완료 (${duration}ms)`);
        return {
            phase: 'Phase2',
            entityCounts: {
                EvaluationPeriod: periodIds.length,
                EvaluationPeriodEmployeeMapping: mappingIds.length,
            },
            generatedIds: {
                periodIds,
                mappingIds,
            },
            duration,
        };
    }
    async 생성_평가기간들(count, dist, systemAdminId) {
        const periods = [];
        const baseDate = new Date();
        const uniqueSuffix = Date.now().toString(36).slice(-4);
        for (let i = 0; i < count; i++) {
            const period = new evaluation_period_entity_1.EvaluationPeriod();
            const year = baseDate.getFullYear() - i;
            const halfYear = i % 2 === 0 ? '상반기' : '하반기';
            period.name = `${year}년 ${halfYear} 평가-${uniqueSuffix}`;
            const { startDate } = utils_1.DateGeneratorUtil.generateDateRange(utils_1.DateGeneratorUtil.addMonths(baseDate, -i * 6), dist.dateGeneration.evaluationPeriod.durationMonths.min, dist.dateGeneration.evaluationPeriod.durationMonths.max, 'months');
            period.startDate = startDate;
            period.description = faker_1.faker.lorem.sentence();
            const statusKey = utils_1.ProbabilityUtil.selectByProbability(dist.evaluationPeriodStatus);
            period.status =
                statusKey === 'waiting'
                    ? evaluation_period_types_1.EvaluationPeriodStatus.WAITING
                    : statusKey === 'inProgress'
                        ? evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS
                        : evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED;
            if (period.status === evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS) {
                const phaseKey = utils_1.ProbabilityUtil.selectByProbability(dist.evaluationPeriodPhase);
                period.currentPhase = this.맵_단계_키_to_Enum(phaseKey);
                this.설정_단계별_마감일(period, dist);
            }
            else if (period.status === evaluation_period_types_1.EvaluationPeriodStatus.WAITING) {
                period.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.WAITING;
            }
            else {
                period.currentPhase = evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE;
                period.completedDate = new Date();
            }
            period.criteriaSettingEnabled = Math.random() < 0.2;
            period.selfEvaluationSettingEnabled = Math.random() < 0.2;
            period.finalEvaluationSettingEnabled = Math.random() < 0.2;
            period.maxSelfEvaluationRate = [100, 110, 120, 150][Math.floor(Math.random() * 4)];
            period.gradeRanges = this.생성_기본_등급구간();
            period.createdBy = systemAdminId;
            periods.push(period);
        }
        const saved = await this.평가기간을_배치로_저장한다(periods);
        return saved.map((p) => p.id);
    }
    생성_기본_등급구간() {
        return [
            { grade: 'S', minRange: 95, maxRange: 100 },
            { grade: 'A', minRange: 90, maxRange: 94.99 },
            { grade: 'B', minRange: 80, maxRange: 89.99 },
            { grade: 'C', minRange: 70, maxRange: 79.99 },
            { grade: 'D', minRange: 60, maxRange: 69.99 },
            { grade: 'F', minRange: 0, maxRange: 59.99 },
        ];
    }
    맵_단계_키_to_Enum(key) {
        const map = {
            evaluationSetup: evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP,
            performance: evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE,
            selfEvaluation: evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION,
            peerEvaluation: evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION,
            closure: evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE,
        };
        return map[key] || evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP;
    }
    설정_단계별_마감일(period, dist) {
        const gapDays = dist.dateGeneration.evaluationPeriod.phaseGapDays;
        let currentDate = new Date(period.startDate);
        period.evaluationSetupDeadline = utils_1.DateGeneratorUtil.addDays(currentDate, gapDays * 2);
        currentDate = period.evaluationSetupDeadline;
        period.performanceDeadline = utils_1.DateGeneratorUtil.addDays(currentDate, gapDays * 8);
        currentDate = period.performanceDeadline;
        period.selfEvaluationDeadline = utils_1.DateGeneratorUtil.addDays(currentDate, gapDays * 2);
        currentDate = period.selfEvaluationDeadline;
        period.peerEvaluationDeadline = utils_1.DateGeneratorUtil.addDays(currentDate, gapDays * 2);
    }
    async 생성_평가대상자_매핑들(periodIds, employeeIds, dist, systemAdminId) {
        const allMappings = [];
        for (const periodId of periodIds) {
            const mappings = [];
            for (const employeeId of employeeIds) {
                const mapping = new evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping();
                mapping.evaluationPeriodId = periodId;
                mapping.employeeId = employeeId;
                mapping.isExcluded = utils_1.ProbabilityUtil.rollDice(dist.excludedFromEvaluation);
                if (mapping.isExcluded) {
                    mapping.excludeReason = faker_1.faker.lorem.sentence();
                    mapping.excludedBy = systemAdminId;
                    mapping.excludedAt = new Date();
                }
                mapping.createdBy = systemAdminId;
                mappings.push(mapping);
            }
            const saved = await this.매핑을_배치로_저장한다(mappings);
            allMappings.push(...saved);
        }
        return allMappings.map((m) => m.id);
    }
    async 평가기간을_배치로_저장한다(periods) {
        const saved = [];
        for (let i = 0; i < periods.length; i += BATCH_SIZE) {
            const batch = periods.slice(i, i + BATCH_SIZE);
            const result = await this.periodRepository.save(batch);
            saved.push(...result);
            this.logger.log(`평가기간 저장 진행: ${Math.min(i + BATCH_SIZE, periods.length)}/${periods.length}`);
        }
        return saved;
    }
    async 매핑을_배치로_저장한다(mappings) {
        const saved = [];
        for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
            const batch = mappings.slice(i, i + BATCH_SIZE);
            const result = await this.mappingRepository.save(batch);
            saved.push(...result);
            this.logger.log(`매핑 저장 진행: ${Math.min(i + BATCH_SIZE, mappings.length)}/${mappings.length}`);
        }
        return saved;
    }
};
exports.Phase2EvaluationPeriodGenerator = Phase2EvaluationPeriodGenerator;
exports.Phase2EvaluationPeriodGenerator = Phase2EvaluationPeriodGenerator = Phase2EvaluationPeriodGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], Phase2EvaluationPeriodGenerator);
//# sourceMappingURL=phase2-evaluation-period.generator.js.map