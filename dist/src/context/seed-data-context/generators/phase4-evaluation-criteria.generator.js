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
var Phase4EvaluationCriteriaGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase4EvaluationCriteriaGenerator = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const faker_1 = require("@faker-js/faker");
const wbs_evaluation_criteria_entity_1 = require("../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const evaluation_line_entity_1 = require("../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_mapping_entity_1 = require("../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const evaluation_line_types_1 = require("../../../domain/core/evaluation-line/evaluation-line.types");
const wbs_assignment_weight_calculation_service_1 = require("../../evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service");
const types_1 = require("../types");
const utils_1 = require("../utils");
const BATCH_SIZE = 500;
let Phase4EvaluationCriteriaGenerator = Phase4EvaluationCriteriaGenerator_1 = class Phase4EvaluationCriteriaGenerator {
    wbsCriteriaRepository;
    evaluationLineRepository;
    evaluationLineMappingRepository;
    wbsAssignmentRepository;
    weightCalculationService;
    logger = new common_1.Logger(Phase4EvaluationCriteriaGenerator_1.name);
    constructor(wbsCriteriaRepository, evaluationLineRepository, evaluationLineMappingRepository, wbsAssignmentRepository, weightCalculationService) {
        this.wbsCriteriaRepository = wbsCriteriaRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.weightCalculationService = weightCalculationService;
    }
    async generate(config, phase1Result, phase2Result, phase3Result) {
        const startTime = Date.now();
        const dist = {
            ...types_1.DEFAULT_STATE_DISTRIBUTION,
            ...config.stateDistribution,
        };
        this.logger.log('Phase 4: 평가 기준 및 라인 생성');
        const systemAdminId = phase1Result.generatedIds.systemAdminId;
        const wbsIds = phase1Result.generatedIds.wbsIds;
        const employeeIds = phase1Result.generatedIds.employeeIds;
        const periodIds = phase2Result.generatedIds.periodIds;
        const assignedWbsIds = await this.실제_할당된_WBS_ID를_조회한다(periodIds[0]);
        this.logger.log(`실제 할당된 WBS: ${assignedWbsIds.length}개 (전체 WBS: ${wbsIds.length}개)`);
        const criteria = await this.생성_WBS평가기준들(assignedWbsIds, dist, systemAdminId);
        this.logger.log(`생성 완료: WbsEvaluationCriteria ${criteria.length}개`);
        const evaluationLines = await this.생성_평가라인들(systemAdminId);
        this.logger.log(`생성 완료: EvaluationLine ${evaluationLines.length}개`);
        const lineMappings = await this.생성_평가라인매핑들(periodIds[0], employeeIds, evaluationLines, dist, systemAdminId, config.currentUserId);
        this.logger.log(`생성 완료: EvaluationLineMapping ${lineMappings.length}개`);
        await this.WBS할당_가중치를_재계산한다(employeeIds, periodIds);
        const duration = Date.now() - startTime;
        this.logger.log(`Phase 4 완료 (${duration}ms)`);
        return {
            phase: 'Phase4',
            entityCounts: {
                WbsEvaluationCriteria: criteria.length,
                EvaluationLine: evaluationLines.length,
                EvaluationLineMapping: lineMappings.length,
            },
            generatedIds: {
                criteriaIds: criteria.map((c) => c.id),
                evaluationLineIds: evaluationLines.map((el) => el.id),
                lineMappingIds: lineMappings.map((lm) => lm.id),
            },
            duration,
        };
    }
    async 생성_WBS평가기준들(wbsIds, dist, systemAdminId) {
        this.logger.log(`평가기준 생성 시작 - WBS 개수: ${wbsIds.length}`);
        const allCriteria = [];
        for (const wbsId of wbsIds) {
            const criteria = new wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria();
            criteria.wbsItemId = wbsId;
            criteria.criteria = faker_1.faker.lorem.sentence();
            criteria.importance = faker_1.faker.number.int({ min: 1, max: 10 });
            criteria.createdBy = systemAdminId;
            allCriteria.push(criteria);
        }
        this.logger.log(`평가기준 저장 전 - 생성된 개수: ${allCriteria.length}`);
        const saved = await this.배치로_저장한다(this.wbsCriteriaRepository, allCriteria, 'WBS 평가기준');
        this.logger.log(`평가기준 저장 완료 - 저장된 개수: ${saved.length}`);
        return saved;
    }
    async 생성_평가라인들(systemAdminId) {
        const lines = [];
        const primary = new evaluation_line_entity_1.EvaluationLine();
        primary.evaluatorType = evaluation_line_types_1.EvaluatorType.PRIMARY;
        primary.order = 1;
        primary.isRequired = true;
        primary.isAutoAssigned = false;
        primary.createdBy = systemAdminId;
        lines.push(primary);
        const secondary = new evaluation_line_entity_1.EvaluationLine();
        secondary.evaluatorType = evaluation_line_types_1.EvaluatorType.SECONDARY;
        secondary.order = 2;
        secondary.isRequired = false;
        secondary.isAutoAssigned = false;
        secondary.createdBy = systemAdminId;
        lines.push(secondary);
        return await this.evaluationLineRepository.save(lines);
    }
    async 생성_평가라인매핑들(evaluationPeriodId, employeeIds, evaluationLines, dist, systemAdminId, currentUserId) {
        const mappings = [];
        const primaryLine = evaluationLines.find((el) => el.evaluatorType === evaluation_line_types_1.EvaluatorType.PRIMARY);
        const secondaryLine = evaluationLines.find((el) => el.evaluatorType === evaluation_line_types_1.EvaluatorType.SECONDARY);
        const departmentMap = await this.부서별_직원_그룹화(employeeIds);
        const wbsAssignments = await this.wbsAssignmentRepository.find({
            where: {
                periodId: evaluationPeriodId,
                deletedAt: null,
            },
        });
        this.logger.log(`WBS 할당 ${wbsAssignments.length}개에 대해 평가라인 매핑 생성`);
        const processedEmployees = new Set();
        for (const assignment of wbsAssignments) {
            const employeeId = assignment.employeeId;
            if (processedEmployees.has(employeeId))
                continue;
            const primaryEvaluator = await this.일차평가자_선택(employeeId, employeeIds, departmentMap, currentUserId);
            if (!primaryEvaluator)
                continue;
            const primaryMapping = new evaluation_line_mapping_entity_1.EvaluationLineMapping();
            primaryMapping.evaluationPeriodId = evaluationPeriodId;
            primaryMapping.employeeId = employeeId;
            primaryMapping.evaluatorId = primaryEvaluator;
            primaryMapping.wbsItemId = undefined;
            primaryMapping.evaluationLineId = primaryLine.id;
            primaryMapping.createdBy = systemAdminId;
            mappings.push(primaryMapping);
            processedEmployees.add(employeeId);
        }
        for (const assignment of wbsAssignments) {
            const employeeId = assignment.employeeId;
            const wbsItemId = assignment.wbsItemId;
            const primaryEvaluator = await this.일차평가자_선택(employeeId, employeeIds, departmentMap, currentUserId);
            if (!primaryEvaluator)
                continue;
            const mappingType = utils_1.ProbabilityUtil.selectByProbability(dist.evaluationLineMappingTypes);
            if (mappingType === 'primaryAndSecondary' ||
                mappingType === 'withAdditional') {
                const otherEmployees = employeeIds.filter((id) => id !== employeeId && id !== primaryEvaluator);
                if (otherEmployees.length > 0) {
                    let secondaryEvaluator;
                    if (currentUserId && currentUserId !== primaryEvaluator && otherEmployees.includes(currentUserId)) {
                        secondaryEvaluator = currentUserId;
                        this.logger.log(`현재 사용자를 2차 평가자로 선택: ${currentUserId}`);
                    }
                    else {
                        secondaryEvaluator = otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
                    }
                    const secondaryMapping = new evaluation_line_mapping_entity_1.EvaluationLineMapping();
                    secondaryMapping.evaluationPeriodId = evaluationPeriodId;
                    secondaryMapping.employeeId = employeeId;
                    secondaryMapping.evaluatorId = secondaryEvaluator;
                    secondaryMapping.wbsItemId = wbsItemId;
                    secondaryMapping.evaluationLineId = secondaryLine.id;
                    secondaryMapping.createdBy = systemAdminId;
                    mappings.push(secondaryMapping);
                }
            }
        }
        return await this.배치로_저장한다(this.evaluationLineMappingRepository, mappings, '평가 라인 매핑');
    }
    async 부서별_직원_그룹화(employeeIds) {
        const departmentMap = new Map();
        const employees = await this.evaluationLineMappingRepository.manager
            .createQueryBuilder()
            .select(['employee.id', 'employee.departmentId'])
            .from('employee', 'employee')
            .where('employee.id IN (:...employeeIds)', { employeeIds })
            .andWhere('employee.deletedAt IS NULL')
            .orderBy('employee.createdAt', 'ASC')
            .getRawMany();
        for (const emp of employees) {
            const deptId = emp.employee_departmentId || 'NO_DEPARTMENT';
            if (!departmentMap.has(deptId)) {
                departmentMap.set(deptId, []);
            }
            departmentMap.get(deptId).push(emp.employee_id);
        }
        return departmentMap;
    }
    async 일차평가자_선택(employeeId, allEmployeeIds, departmentMap, currentUserId) {
        if (currentUserId && currentUserId !== employeeId && allEmployeeIds.includes(currentUserId)) {
            this.logger.log(`현재 사용자를 1차 평가자로 선택: ${currentUserId}`);
            return currentUserId;
        }
        let employeeDepartment = null;
        let isDepartmentHead = false;
        for (const [deptId, empIds] of departmentMap.entries()) {
            if (empIds.includes(employeeId)) {
                employeeDepartment = deptId;
                isDepartmentHead = empIds[0] === employeeId;
                break;
            }
        }
        if (!isDepartmentHead && employeeDepartment) {
            const deptEmployees = departmentMap.get(employeeDepartment);
            if (deptEmployees && deptEmployees.length > 0) {
                return deptEmployees[0];
            }
        }
        if (isDepartmentHead) {
            const otherDepartmentHeads = [];
            for (const [deptId, empIds] of departmentMap.entries()) {
                if (deptId !== employeeDepartment && empIds.length > 0) {
                    otherDepartmentHeads.push(empIds[0]);
                }
            }
            if (otherDepartmentHeads.length > 0) {
                return otherDepartmentHeads[Math.floor(Math.random() * otherDepartmentHeads.length)];
            }
        }
        const otherEmployees = allEmployeeIds.filter((id) => id !== employeeId);
        if (otherEmployees.length === 0)
            return null;
        return otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
    }
    async WBS할당_가중치를_재계산한다(employeeIds, periodIds) {
        this.logger.log(`WBS 할당 가중치 재계산 시작 - 직원: ${employeeIds.length}명, 평가기간: ${periodIds.length}개`);
        let recalculatedCount = 0;
        let totalAssignments = 0;
        for (const employeeId of employeeIds) {
            for (const periodId of periodIds) {
                const hasAssignment = await this.wbsAssignmentRepository
                    .createQueryBuilder('assignment')
                    .where('assignment.employeeId = :employeeId', { employeeId })
                    .andWhere('assignment.periodId = :periodId', { periodId })
                    .andWhere('assignment.deletedAt IS NULL')
                    .getCount();
                if (hasAssignment > 0) {
                    totalAssignments += hasAssignment;
                    await this.weightCalculationService.직원_평가기간_가중치를_재계산한다(employeeId, periodId);
                    recalculatedCount++;
                }
            }
        }
        this.logger.log(`WBS 할당 가중치 재계산 완료 - ${recalculatedCount}개 직원-평가기간 조합, 총 ${totalAssignments}개 할당`);
        if (recalculatedCount > 0) {
            const sampleAssignment = await this.wbsAssignmentRepository
                .createQueryBuilder('assignment')
                .where('assignment.deletedAt IS NULL')
                .orderBy('assignment.createdAt', 'ASC')
                .limit(5)
                .getMany();
            this.logger.log(`샘플 WBS 할당 가중치: ${sampleAssignment.map((a) => `${a.weight}`).join(', ')}`);
        }
    }
    async 실제_할당된_WBS_ID를_조회한다(periodId) {
        const assignments = await this.wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .select('DISTINCT assignment.wbsItemId', 'wbsItemId')
            .where('assignment.periodId = :periodId', { periodId })
            .andWhere('assignment.deletedAt IS NULL')
            .getRawMany();
        return assignments.map((a) => a.wbsItemId);
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
};
exports.Phase4EvaluationCriteriaGenerator = Phase4EvaluationCriteriaGenerator;
exports.Phase4EvaluationCriteriaGenerator = Phase4EvaluationCriteriaGenerator = Phase4EvaluationCriteriaGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(3, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        wbs_assignment_weight_calculation_service_1.WbsAssignmentWeightCalculationService])
], Phase4EvaluationCriteriaGenerator);
//# sourceMappingURL=phase4-evaluation-criteria.generator.js.map