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
var Phase3AssignmentGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase3AssignmentGenerator = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_item_entity_1 = require("../../../domain/common/wbs-item/wbs-item.entity");
const types_1 = require("../types");
const utils_1 = require("../utils");
const BATCH_SIZE = 500;
let Phase3AssignmentGenerator = Phase3AssignmentGenerator_1 = class Phase3AssignmentGenerator {
    projectAssignmentRepository;
    wbsAssignmentRepository;
    wbsItemRepository;
    logger = new common_1.Logger(Phase3AssignmentGenerator_1.name);
    constructor(projectAssignmentRepository, wbsAssignmentRepository, wbsItemRepository) {
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.wbsItemRepository = wbsItemRepository;
    }
    async generate(config, phase1Result, phase2Result) {
        const startTime = Date.now();
        const dist = {
            ...types_1.DEFAULT_STATE_DISTRIBUTION,
            ...config.stateDistribution,
        };
        this.logger.log('Phase 3: 프로젝트 및 WBS 할당 생성');
        const systemAdminId = phase1Result.generatedIds.systemAdminId;
        const periodIds = phase2Result.generatedIds.periodIds;
        const employeeIds = phase1Result.generatedIds.employeeIds;
        const projectIds = phase1Result.generatedIds.projectIds;
        const wbsIds = phase1Result.generatedIds.wbsIds;
        const projectAssignments = await this.생성_프로젝트_할당들(periodIds, employeeIds, projectIds, systemAdminId);
        this.logger.log(`생성 완료: EvaluationProjectAssignment ${projectAssignments.length}개`);
        const wbsAssignments = await this.생성_WBS_할당들(periodIds, employeeIds, projectIds, wbsIds, systemAdminId);
        this.logger.log(`생성 완료: EvaluationWbsAssignment ${wbsAssignments.length}개`);
        const duration = Date.now() - startTime;
        this.logger.log(`Phase 3 완료 (${duration}ms)`);
        return {
            phase: 'Phase3',
            entityCounts: {
                EvaluationProjectAssignment: projectAssignments.length,
                EvaluationWbsAssignment: wbsAssignments.length,
            },
            generatedIds: {
                projectAssignmentIds: projectAssignments.map((pa) => pa.id),
                wbsAssignmentIds: wbsAssignments.map((wa) => wa.id),
            },
            duration,
        };
    }
    async 생성_프로젝트_할당들(periodIds, employeeIds, projectIds, systemAdminId) {
        const assignments = [];
        const periodId = periodIds[0];
        const assignerId = systemAdminId;
        for (const employeeId of employeeIds) {
            const projectCount = utils_1.ProbabilityUtil.randomInt(1, Math.min(3, projectIds.length));
            const selectedProjects = this.랜덤_선택(projectIds, projectCount);
            for (let i = 0; i < selectedProjects.length; i++) {
                const assignment = new evaluation_project_assignment_entity_1.EvaluationProjectAssignment();
                assignment.periodId = periodId;
                assignment.employeeId = employeeId;
                assignment.projectId = selectedProjects[i];
                assignment.assignedBy = assignerId;
                assignment.assignedDate = new Date();
                assignment.displayOrder = i;
                assignment.createdBy = systemAdminId;
                assignments.push(assignment);
            }
        }
        return await this.배치로_저장한다(this.projectAssignmentRepository, assignments, '프로젝트 할당');
    }
    async 생성_WBS_할당들(periodIds, employeeIds, projectIds, wbsIds, systemAdminId) {
        const assignments = [];
        const periodId = periodIds[0];
        const assignerId = systemAdminId;
        const wbsItemsByProject = await this.wbsItemRepository
            .createQueryBuilder('wbs')
            .select(['wbs.id', 'wbs.projectId'])
            .where('wbs.id IN (:...wbsIds)', { wbsIds })
            .andWhere('wbs.deletedAt IS NULL')
            .getRawMany();
        const projectWbsMap = new Map();
        for (const wbs of wbsItemsByProject) {
            const projectId = wbs.wbs_projectId;
            if (!projectWbsMap.has(projectId)) {
                projectWbsMap.set(projectId, []);
            }
            projectWbsMap.get(projectId).push(wbs.wbs_id);
        }
        const projectAssignments = await this.projectAssignmentRepository
            .createQueryBuilder('assignment')
            .select([
            'assignment.employeeId AS assignment_employeeid',
            'assignment.projectId AS assignment_projectid',
        ])
            .where('assignment.periodId = :periodId', { periodId })
            .andWhere('assignment.deletedAt IS NULL')
            .getRawMany();
        const employeeProjectsMap = new Map();
        for (const assignment of projectAssignments) {
            const empId = assignment.assignment_employeeid;
            const projId = assignment.assignment_projectid;
            if (!employeeProjectsMap.has(empId)) {
                employeeProjectsMap.set(empId, []);
            }
            employeeProjectsMap.get(empId).push(projId);
        }
        for (const employeeId of employeeIds) {
            const employeeProjects = employeeProjectsMap.get(employeeId) || [];
            if (employeeProjects.length === 0) {
                this.logger.warn(`직원 ${employeeId}에게 할당된 프로젝트가 없습니다.`);
                continue;
            }
            for (const projectId of employeeProjects) {
                const projectWbsList = projectWbsMap.get(projectId) || [];
                if (projectWbsList.length === 0) {
                    this.logger.warn(`프로젝트 ${projectId}에 속한 WBS가 없습니다.`);
                    continue;
                }
                const wbsCount = utils_1.ProbabilityUtil.randomInt(2, Math.min(5, projectWbsList.length));
                const selectedWbs = this.랜덤_선택(projectWbsList, wbsCount);
                for (let i = 0; i < selectedWbs.length; i++) {
                    const assignment = new evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment();
                    assignment.periodId = periodId;
                    assignment.employeeId = employeeId;
                    assignment.projectId = projectId;
                    assignment.wbsItemId = selectedWbs[i];
                    assignment.assignedBy = assignerId;
                    assignment.assignedDate = new Date();
                    assignment.displayOrder = i;
                    assignment.createdBy = systemAdminId;
                    assignments.push(assignment);
                }
            }
        }
        return await this.배치로_저장한다(this.wbsAssignmentRepository, assignments, 'WBS 할당');
    }
    랜덤_선택(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
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
exports.Phase3AssignmentGenerator = Phase3AssignmentGenerator;
exports.Phase3AssignmentGenerator = Phase3AssignmentGenerator = Phase3AssignmentGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(2, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], Phase3AssignmentGenerator);
//# sourceMappingURL=phase3-assignment.generator.js.map