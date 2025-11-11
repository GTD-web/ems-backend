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
var Phase7EvaluationGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase7EvaluationGenerator = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const faker_1 = require("@faker-js/faker");
const wbs_self_evaluation_entity_1 = require("../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_entity_1 = require("../../../domain/core/downward-evaluation/downward-evaluation.entity");
const downward_evaluation_types_1 = require("../../../domain/core/downward-evaluation/downward-evaluation.types");
const peer_evaluation_entity_1 = require("../../../domain/core/peer-evaluation/peer-evaluation.entity");
const peer_evaluation_types_1 = require("../../../domain/core/peer-evaluation/peer-evaluation.types");
const final_evaluation_entity_1 = require("../../../domain/core/final-evaluation/final-evaluation.entity");
const final_evaluation_types_1 = require("../../../domain/core/final-evaluation/final-evaluation.types");
const evaluation_period_entity_1 = require("../../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const evaluation_line_mapping_entity_1 = require("../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_entity_1 = require("../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_types_1 = require("../../../domain/core/evaluation-line/evaluation-line.types");
const evaluation_period_employee_mapping_entity_1 = require("../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const types_1 = require("../types");
const utils_1 = require("../utils");
const BATCH_SIZE = 500;
let Phase7EvaluationGenerator = Phase7EvaluationGenerator_1 = class Phase7EvaluationGenerator {
    wbsSelfEvaluationRepository;
    downwardEvaluationRepository;
    peerEvaluationRepository;
    finalEvaluationRepository;
    evaluationPeriodRepository;
    wbsAssignmentRepository;
    evaluationLineMappingRepository;
    evaluationLineRepository;
    evaluationPeriodEmployeeMappingRepository;
    logger = new common_1.Logger(Phase7EvaluationGenerator_1.name);
    constructor(wbsSelfEvaluationRepository, downwardEvaluationRepository, peerEvaluationRepository, finalEvaluationRepository, evaluationPeriodRepository, wbsAssignmentRepository, evaluationLineMappingRepository, evaluationLineRepository, evaluationPeriodEmployeeMappingRepository) {
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
        this.downwardEvaluationRepository = downwardEvaluationRepository;
        this.peerEvaluationRepository = peerEvaluationRepository;
        this.finalEvaluationRepository = finalEvaluationRepository;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.evaluationPeriodEmployeeMappingRepository = evaluationPeriodEmployeeMappingRepository;
    }
    async generate(config, phase1Result, phase2Result) {
        const startTime = Date.now();
        const dist = {
            ...types_1.DEFAULT_STATE_DISTRIBUTION,
            ...config.stateDistribution,
        };
        this.logger.log('Phase 7: 평가 실행 생성');
        this.logger.log(`자기평가 진행 상태 설정: ${JSON.stringify(dist.selfEvaluationProgress)}`);
        const systemAdminId = phase1Result.generatedIds.systemAdminId;
        const employeeIds = phase1Result.generatedIds.employeeIds;
        const periodIds = phase2Result.generatedIds.periodIds;
        const periodMaxRates = await this.평가기간_최대달성률을_조회한다(periodIds);
        const selfEvaluations = await this.생성_자기평가들(employeeIds, periodIds, periodMaxRates, dist, systemAdminId);
        this.logger.log(`생성 완료: WbsSelfEvaluation ${selfEvaluations.length}개`);
        const downwardEvaluations = await this.생성_하향평가들(employeeIds, periodIds, periodMaxRates, dist, systemAdminId);
        this.logger.log(`생성 완료: DownwardEvaluation ${downwardEvaluations.length}개`);
        const peerEvaluations = await this.생성_동료평가들(employeeIds, periodIds, dist, systemAdminId);
        this.logger.log(`생성 완료: PeerEvaluation ${peerEvaluations.length}개`);
        const finalEvaluations = await this.생성_최종평가들(employeeIds, periodIds, dist, systemAdminId);
        this.logger.log(`생성 완료: FinalEvaluation ${finalEvaluations.length}개`);
        const duration = Date.now() - startTime;
        this.logger.log(`Phase 7 완료 (${duration}ms)`);
        return {
            phase: 'Phase7',
            entityCounts: {
                WbsSelfEvaluation: selfEvaluations.length,
                DownwardEvaluation: downwardEvaluations.length,
                PeerEvaluation: peerEvaluations.length,
                FinalEvaluation: finalEvaluations.length,
            },
            generatedIds: {
                selfEvaluationIds: selfEvaluations.map((se) => se.id),
                downwardEvaluationIds: downwardEvaluations.map((de) => de.id),
                peerEvaluationIds: peerEvaluations.map((pe) => pe.id),
                finalEvaluationIds: finalEvaluations.map((fe) => fe.id),
            },
            duration,
        };
    }
    async 생성_자기평가들(employeeIds, periodIds, periodMaxRates, dist, systemAdminId) {
        const evaluations = [];
        const periodId = periodIds[0];
        const maxRate = periodMaxRates.get(periodId) || 120;
        const wbsAssignments = await this.wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .select([
            'assignment.id',
            'assignment.employeeId',
            'assignment.periodId',
            'assignment.wbsItemId',
            'assignment.assignedBy',
            'assignment.assignedDate',
        ])
            .where('assignment.periodId = :periodId', { periodId })
            .andWhere('assignment.deletedAt IS NULL')
            .getMany();
        this.logger.log(`조회된 WBS 할당: ${wbsAssignments.length}개`);
        this.logger.log(`자기평가 진행 상태 설정: ${JSON.stringify(dist.selfEvaluationProgress)}`);
        for (const assignment of wbsAssignments) {
            const statusChoice = utils_1.ProbabilityUtil.selectByProbability(dist.selfEvaluationProgress);
            const isCompleted = statusChoice === 'completed';
            const evaluation = new wbs_self_evaluation_entity_1.WbsSelfEvaluation();
            evaluation.employeeId = assignment.employeeId;
            evaluation.periodId = assignment.periodId;
            evaluation.wbsItemId = assignment.wbsItemId;
            evaluation.assignedBy = assignment.assignedBy || systemAdminId;
            evaluation.assignedDate = assignment.assignedDate || new Date();
            evaluation.evaluationDate = new Date();
            evaluation.submittedToEvaluator = isCompleted;
            evaluation.submittedToManager = isCompleted;
            if (isCompleted) {
                evaluation.submittedToEvaluatorAt = new Date();
                evaluation.submittedToManagerAt = new Date();
                const mean = Math.round(maxRate * 0.7);
                const stdDev = Math.round(maxRate * 0.1);
                evaluation.selfEvaluationScore = utils_1.ScoreGeneratorUtil.generateNormalScore(1, maxRate, mean, stdDev);
                evaluation.selfEvaluationContent = faker_1.faker.lorem.paragraph();
                evaluation.performanceResult = faker_1.faker.lorem.paragraph();
            }
            evaluation.createdBy = systemAdminId;
            evaluations.push(evaluation);
        }
        this.logger.log(`자기평가 생성 - 총 ${evaluations.length}개 (완료: ${evaluations.filter((e) => e.submittedToManager).length}개)`);
        this.logger.log(`자기평가 점수 범위: 1-${maxRate} (평균: ${Math.round(maxRate * 0.7)})`);
        const savedEvaluations = await this.배치로_저장한다(this.wbsSelfEvaluationRepository, evaluations, '자기평가');
        await this.수정가능상태_업데이트_자기평가(savedEvaluations, periodId, systemAdminId);
        return savedEvaluations;
    }
    async 생성_하향평가들(employeeIds, periodIds, periodMaxRates, dist, systemAdminId) {
        const evaluations = [];
        const periodId = periodIds[0];
        const wbsAssignments = await this.wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .select([
            'assignment.id',
            'assignment.employeeId',
            'assignment.periodId',
            'assignment.wbsItemId',
        ])
            .where('assignment.periodId = :periodId', { periodId })
            .andWhere('assignment.deletedAt IS NULL')
            .getMany();
        this.logger.log(`조회된 WBS 할당: ${wbsAssignments.length}개`);
        const evaluationLines = await this.evaluationLineRepository
            .createQueryBuilder('line')
            .where('line.deletedAt IS NULL')
            .andWhere('line.evaluatorType IN (:...types)', {
            types: [evaluation_line_types_1.EvaluatorType.PRIMARY, evaluation_line_types_1.EvaluatorType.SECONDARY],
        })
            .getMany();
        const primaryLine = evaluationLines.find((l) => l.evaluatorType === evaluation_line_types_1.EvaluatorType.PRIMARY);
        const secondaryLine = evaluationLines.find((l) => l.evaluatorType === evaluation_line_types_1.EvaluatorType.SECONDARY);
        if (!primaryLine) {
            this.logger.warn('PRIMARY 평가라인이 없습니다.');
            return [];
        }
        for (const assignment of wbsAssignments) {
            const lineMappings = await this.evaluationLineMappingRepository
                .createQueryBuilder('mapping')
                .where('mapping.employeeId = :employeeId', {
                employeeId: assignment.employeeId,
            })
                .andWhere('mapping.wbsItemId = :wbsItemId', {
                wbsItemId: assignment.wbsItemId,
            })
                .andWhere('mapping.evaluationLineId IN (:...lineIds)', {
                lineIds: [primaryLine.id, secondaryLine?.id].filter(Boolean),
            })
                .andWhere('mapping.deletedAt IS NULL')
                .getMany();
            const primaryMapping = lineMappings.find((m) => m.evaluationLineId === primaryLine.id);
            if (primaryMapping) {
                const primaryProgress = dist.primaryDownwardEvaluationProgress ||
                    dist.downwardEvaluationProgress;
                const statusChoice = utils_1.ProbabilityUtil.selectByProbability(primaryProgress);
                const isCompleted = statusChoice === 'completed';
                const evaluation = new downward_evaluation_entity_1.DownwardEvaluation();
                evaluation.employeeId = assignment.employeeId;
                evaluation.evaluatorId = primaryMapping.evaluatorId;
                evaluation.periodId = assignment.periodId;
                evaluation.wbsId = assignment.wbsItemId;
                evaluation.evaluationType = downward_evaluation_types_1.DownwardEvaluationType.PRIMARY;
                evaluation.evaluationDate = new Date();
                evaluation.isCompleted = isCompleted;
                if (isCompleted) {
                    evaluation.completedAt = new Date();
                    const maxRate = periodMaxRates.get(periodId) || 100;
                    const mean = maxRate / 2;
                    const stdDev = maxRate / 6;
                    evaluation.downwardEvaluationScore =
                        utils_1.ScoreGeneratorUtil.generateNormalScore(0, maxRate, mean, stdDev);
                    evaluation.downwardEvaluationContent = faker_1.faker.lorem.paragraph();
                }
                evaluation.createdBy = primaryMapping.evaluatorId;
                evaluations.push(evaluation);
            }
            if (secondaryLine) {
                const secondaryMapping = lineMappings.find((m) => m.evaluationLineId === secondaryLine.id);
                if (secondaryMapping) {
                    const secondaryProgress = dist.secondaryDownwardEvaluationProgress ||
                        dist.downwardEvaluationProgress;
                    const statusChoice = utils_1.ProbabilityUtil.selectByProbability(secondaryProgress);
                    const isCompleted = statusChoice === 'completed';
                    const evaluation = new downward_evaluation_entity_1.DownwardEvaluation();
                    evaluation.employeeId = assignment.employeeId;
                    evaluation.evaluatorId = secondaryMapping.evaluatorId;
                    evaluation.periodId = assignment.periodId;
                    evaluation.wbsId = assignment.wbsItemId;
                    evaluation.evaluationType = downward_evaluation_types_1.DownwardEvaluationType.SECONDARY;
                    evaluation.evaluationDate = new Date();
                    evaluation.isCompleted = isCompleted;
                    if (isCompleted) {
                        evaluation.completedAt = new Date();
                        const maxRate = periodMaxRates.get(periodId) || 100;
                        const mean = maxRate / 2;
                        const stdDev = maxRate / 6;
                        evaluation.downwardEvaluationScore =
                            utils_1.ScoreGeneratorUtil.generateNormalScore(0, maxRate, mean, stdDev);
                        evaluation.downwardEvaluationContent = faker_1.faker.lorem.paragraph();
                    }
                    evaluation.createdBy = secondaryMapping.evaluatorId;
                    evaluations.push(evaluation);
                }
            }
        }
        this.logger.log(`하향평가 생성 - 총 ${evaluations.length}개 (완료: ${evaluations.filter((e) => e.isCompleted).length}개)`);
        const maxRate = periodMaxRates.get(periodId) || 100;
        this.logger.log(`하향평가 점수 범위: 0-${maxRate} (평균: ${maxRate / 2})`);
        const savedEvaluations = await this.배치로_저장한다(this.downwardEvaluationRepository, evaluations, '하향평가');
        await this.수정가능상태_업데이트_하향평가(savedEvaluations, periodId, systemAdminId);
        return savedEvaluations;
    }
    async 생성_동료평가들(employeeIds, periodIds, dist, systemAdminId) {
        const evaluations = [];
        const periodId = periodIds[0];
        for (let i = 0; i < Math.min(20, employeeIds.length); i++) {
            const evaluation = new peer_evaluation_entity_1.PeerEvaluation();
            evaluation.evaluateeId = employeeIds[i];
            evaluation.evaluatorId = employeeIds[(i + 1) % employeeIds.length];
            evaluation.periodId = periodId;
            evaluation.evaluationDate = new Date();
            evaluation.mappedBy = systemAdminId;
            evaluation.mappedDate = new Date();
            evaluation.isActive = true;
            const statusChoice = utils_1.ProbabilityUtil.selectByProbability(dist.peerEvaluationProgress);
            evaluation.status =
                statusChoice === 'completed'
                    ? peer_evaluation_types_1.PeerEvaluationStatus.COMPLETED
                    : statusChoice === 'inProgress'
                        ? peer_evaluation_types_1.PeerEvaluationStatus.IN_PROGRESS
                        : peer_evaluation_types_1.PeerEvaluationStatus.PENDING;
            evaluation.isCompleted = statusChoice === 'completed';
            if (evaluation.isCompleted) {
                evaluation.completedAt = new Date();
            }
            evaluation.createdBy = systemAdminId;
            evaluations.push(evaluation);
        }
        return await this.배치로_저장한다(this.peerEvaluationRepository, evaluations, '동료평가');
    }
    async 생성_최종평가들(employeeIds, periodIds, dist, systemAdminId) {
        const evaluations = [];
        const evaluationGrades = ['S', 'A', 'B', 'C', 'D'];
        const jobGrades = [final_evaluation_types_1.JobGrade.T1, final_evaluation_types_1.JobGrade.T2, final_evaluation_types_1.JobGrade.T3];
        const jobDetailedGrades = [
            final_evaluation_types_1.JobDetailedGrade.U,
            final_evaluation_types_1.JobDetailedGrade.N,
            final_evaluation_types_1.JobDetailedGrade.A,
        ];
        for (const employeeId of employeeIds) {
            for (const periodId of periodIds) {
                const evaluation = new final_evaluation_entity_1.FinalEvaluation();
                evaluation.employeeId = employeeId;
                evaluation.periodId = periodId;
                evaluation.evaluationGrade =
                    evaluationGrades[Math.floor(Math.random() * evaluationGrades.length)];
                evaluation.jobGrade =
                    jobGrades[Math.floor(Math.random() * jobGrades.length)];
                evaluation.jobDetailedGrade =
                    jobDetailedGrades[Math.floor(Math.random() * jobDetailedGrades.length)];
                const statusChoice = utils_1.ProbabilityUtil.selectByProbability(dist.finalEvaluationProgress);
                evaluation.isConfirmed = statusChoice === 'completed';
                if (evaluation.isConfirmed) {
                    evaluation.confirmedAt = new Date();
                    evaluation.confirmedBy = systemAdminId;
                }
                evaluation.finalComments = faker_1.faker.lorem.paragraph();
                evaluation.createdBy = systemAdminId;
                evaluations.push(evaluation);
            }
        }
        return await this.배치로_저장한다(this.finalEvaluationRepository, evaluations, '최종평가');
    }
    async 평가기간_최대달성률을_조회한다(periodIds) {
        const periods = await this.evaluationPeriodRepository.findByIds(periodIds);
        const periodMaxRates = new Map();
        for (const period of periods) {
            periodMaxRates.set(period.id, period.maxSelfEvaluationRate);
            this.logger.log(`평가기간 ${period.name}: maxSelfEvaluationRate = ${period.maxSelfEvaluationRate}`);
        }
        return periodMaxRates;
    }
    async 배치로_저장한다(repository, entities, entityName) {
        const saved = [];
        for (let i = 0; i < entities.length; i += BATCH_SIZE) {
            const batch = entities.slice(i, i + BATCH_SIZE);
            const result = await repository.save(batch);
            saved.push(...result);
            this.logger.log(`${entityName} 저장 진행: ${Math.min(i + BATCH_SIZE, entities.length)}/${entities.length}`);
        }
        return saved;
    }
    async 수정가능상태_업데이트_자기평가(evaluations, periodId, updatedBy) {
        const completedEmployeeIds = [
            ...new Set(evaluations.filter((e) => e.submittedToManager).map((e) => e.employeeId)),
        ];
        if (completedEmployeeIds.length === 0) {
            return;
        }
        this.logger.log(`자기평가 수정 불가 설정 - ${completedEmployeeIds.length}명의 직원`);
        const mappings = await this.evaluationPeriodEmployeeMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.evaluationPeriodId = :periodId', { periodId })
            .andWhere('mapping.employeeId IN (:...employeeIds)', {
            employeeIds: completedEmployeeIds,
        })
            .andWhere('mapping.deletedAt IS NULL')
            .getMany();
        for (const mapping of mappings) {
            mapping.updatedBy = updatedBy;
            mapping.updatedAt = new Date();
        }
        if (mappings.length > 0) {
            await this.evaluationPeriodEmployeeMappingRepository.save(mappings);
            this.logger.log(`자기평가 수정 불가 설정 완료 - ${mappings.length}개 매핑 업데이트`);
        }
    }
    async 수정가능상태_업데이트_하향평가(evaluations, periodId, updatedBy) {
        const primaryCompletedEmployeeIds = [
            ...new Set(evaluations
                .filter((e) => e.isCompleted &&
                e.evaluationType === downward_evaluation_types_1.DownwardEvaluationType.PRIMARY)
                .map((e) => e.employeeId)),
        ];
        const secondaryCompletedEmployeeIds = [
            ...new Set(evaluations
                .filter((e) => e.isCompleted &&
                e.evaluationType === downward_evaluation_types_1.DownwardEvaluationType.SECONDARY)
                .map((e) => e.employeeId)),
        ];
        if (primaryCompletedEmployeeIds.length > 0) {
            this.logger.log(`1차 하향평가 수정 불가 설정 - ${primaryCompletedEmployeeIds.length}명의 직원`);
            const primaryMappings = await this.evaluationPeriodEmployeeMappingRepository
                .createQueryBuilder('mapping')
                .where('mapping.evaluationPeriodId = :periodId', { periodId })
                .andWhere('mapping.employeeId IN (:...employeeIds)', {
                employeeIds: primaryCompletedEmployeeIds,
            })
                .andWhere('mapping.deletedAt IS NULL')
                .getMany();
            for (const mapping of primaryMappings) {
                mapping.updatedBy = updatedBy;
                mapping.updatedAt = new Date();
            }
            if (primaryMappings.length > 0) {
                await this.evaluationPeriodEmployeeMappingRepository.save(primaryMappings);
                this.logger.log(`1차 하향평가 수정 불가 설정 완료 - ${primaryMappings.length}개 매핑 업데이트`);
            }
        }
        if (secondaryCompletedEmployeeIds.length > 0) {
            this.logger.log(`2차 하향평가 수정 불가 설정 - ${secondaryCompletedEmployeeIds.length}명의 직원`);
            const secondaryMappings = await this.evaluationPeriodEmployeeMappingRepository
                .createQueryBuilder('mapping')
                .where('mapping.evaluationPeriodId = :periodId', { periodId })
                .andWhere('mapping.employeeId IN (:...employeeIds)', {
                employeeIds: secondaryCompletedEmployeeIds,
            })
                .andWhere('mapping.deletedAt IS NULL')
                .getMany();
            for (const mapping of secondaryMappings) {
                mapping.updatedBy = updatedBy;
                mapping.updatedAt = new Date();
            }
            if (secondaryMappings.length > 0) {
                await this.evaluationPeriodEmployeeMappingRepository.save(secondaryMappings);
                this.logger.log(`2차 하향평가 수정 불가 설정 완료 - ${secondaryMappings.length}개 매핑 업데이트`);
            }
        }
    }
};
exports.Phase7EvaluationGenerator = Phase7EvaluationGenerator;
exports.Phase7EvaluationGenerator = Phase7EvaluationGenerator = Phase7EvaluationGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __param(1, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __param(2, (0, typeorm_1.InjectRepository)(peer_evaluation_entity_1.PeerEvaluation)),
    __param(3, (0, typeorm_1.InjectRepository)(final_evaluation_entity_1.FinalEvaluation)),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(5, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(6, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(7, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(8, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], Phase7EvaluationGenerator);
//# sourceMappingURL=phase7-evaluation.generator.js.map