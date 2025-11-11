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
var WbsAssignmentWeightCalculationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsAssignmentWeightCalculationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_wbs_assignment_entity_1 = require("../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_evaluation_criteria_entity_1 = require("../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
let WbsAssignmentWeightCalculationService = WbsAssignmentWeightCalculationService_1 = class WbsAssignmentWeightCalculationService {
    assignmentRepository;
    criteriaRepository;
    logger = new common_1.Logger(WbsAssignmentWeightCalculationService_1.name);
    constructor(assignmentRepository, criteriaRepository) {
        this.assignmentRepository = assignmentRepository;
        this.criteriaRepository = criteriaRepository;
    }
    async 직원_평가기간_가중치를_재계산한다(employeeId, periodId, manager) {
        const repository = manager
            ? manager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)
            : this.assignmentRepository;
        const criteriaRepository = manager
            ? manager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)
            : this.criteriaRepository;
        const assignments = await repository.find({
            where: {
                employeeId,
                periodId,
            },
        });
        if (assignments.length === 0) {
            this.logger.log(`가중치 재계산: 할당이 없습니다 - 직원: ${employeeId}, 기간: ${periodId}`);
            return;
        }
        const wbsItemIds = assignments.map((a) => a.wbsItemId);
        const criteriaList = await criteriaRepository
            .createQueryBuilder('criteria')
            .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
            .andWhere('criteria.deletedAt IS NULL')
            .getMany();
        const importanceMap = new Map();
        criteriaList.forEach((criteria) => {
            const currentImportance = importanceMap.get(criteria.wbsItemId) || 0;
            importanceMap.set(criteria.wbsItemId, currentImportance + criteria.importance);
        });
        let totalImportance = 0;
        const assignmentsWithImportance = [];
        assignments.forEach((assignment) => {
            const importance = importanceMap.get(assignment.wbsItemId) || 0;
            if (importance > 0) {
                totalImportance += importance;
                assignmentsWithImportance.push({ assignment, importance });
            }
        });
        if (totalImportance === 0) {
            this.logger.warn(`가중치 재계산: 총 중요도가 0입니다 - 직원: ${employeeId}, 기간: ${periodId}`);
            for (const assignment of assignments) {
                assignment.가중치를_설정한다(0);
            }
        }
        else {
            const weights = [];
            let sumWeights = 0;
            for (let i = 0; i < assignmentsWithImportance.length; i++) {
                const { importance } = assignmentsWithImportance[i];
                const weight = i === assignmentsWithImportance.length - 1
                    ? 100 - sumWeights
                    : Math.round((importance / totalImportance) * 100 * 100) / 100;
                weights.push(weight);
                sumWeights += weight;
            }
            for (let i = 0; i < assignmentsWithImportance.length; i++) {
                const { assignment } = assignmentsWithImportance[i];
                assignment.가중치를_설정한다(weights[i]);
            }
            for (const assignment of assignments) {
                const importance = importanceMap.get(assignment.wbsItemId) || 0;
                if (importance === 0) {
                    assignment.가중치를_설정한다(0);
                }
            }
        }
        for (const assignment of assignments) {
            await repository
                .createQueryBuilder()
                .update()
                .set({ weight: assignment.weight })
                .where('id = :id', { id: assignment.id })
                .execute();
        }
        const weights = assignments.map((a) => a.weight);
        this.logger.log(`가중치 재계산 완료 - 직원: ${employeeId}, 기간: ${periodId}, ` +
            `할당 수: ${assignments.length}, 총 중요도: ${totalImportance}, ` +
            `가중치: [${weights.join(', ')}]`);
    }
    async WBS별_할당된_직원_가중치를_재계산한다(wbsItemId, manager) {
        const repository = manager
            ? manager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)
            : this.assignmentRepository;
        const assignments = await repository
            .createQueryBuilder('assignment')
            .select('assignment.employeeId', 'employeeId')
            .addSelect('assignment.periodId', 'periodId')
            .where('assignment.wbsItemId = :wbsItemId', { wbsItemId })
            .andWhere('assignment.deletedAt IS NULL')
            .distinct(true)
            .getRawMany();
        this.logger.log(`WBS별 가중치 재계산 시작 - WBS: ${wbsItemId}, ` +
            `영향받는 직원-기간 조합: ${assignments.length}`);
        for (const { employeeId, periodId } of assignments) {
            await this.직원_평가기간_가중치를_재계산한다(employeeId, periodId, manager);
        }
        this.logger.log(`WBS별 가중치 재계산 완료 - WBS: ${wbsItemId}`);
    }
};
exports.WbsAssignmentWeightCalculationService = WbsAssignmentWeightCalculationService;
exports.WbsAssignmentWeightCalculationService = WbsAssignmentWeightCalculationService = WbsAssignmentWeightCalculationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(1, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WbsAssignmentWeightCalculationService);
//# sourceMappingURL=wbs-assignment-weight-calculation.service.js.map