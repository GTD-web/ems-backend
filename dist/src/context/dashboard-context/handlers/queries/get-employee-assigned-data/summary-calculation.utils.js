"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSelfEvaluationScore = calculateSelfEvaluationScore;
exports.calculatePrimaryDownwardEvaluationScore = calculatePrimaryDownwardEvaluationScore;
exports.calculateSecondaryDownwardEvaluationScore = calculateSecondaryDownwardEvaluationScore;
const evaluation_line_entity_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
const self_evaluation_utils_1 = require("../get-employee-evaluation-period-status/self-evaluation.utils");
const downward_evaluation_score_utils_1 = require("../get-employee-evaluation-period-status/downward-evaluation-score.utils");
async function calculateSelfEvaluationScore(evaluationPeriodId, employeeId, completedSelfEvaluations, selfEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository) {
    let selfEvaluationScore = null;
    let selfEvaluationGrade = null;
    const totalSelfEvaluations = await selfEvaluationRepository.count({
        where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            deletedAt: null,
        },
    });
    if (totalSelfEvaluations > 0 &&
        completedSelfEvaluations === totalSelfEvaluations) {
        selfEvaluationScore = await (0, self_evaluation_utils_1.가중치_기반_자기평가_점수를_계산한다)(evaluationPeriodId, employeeId, selfEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository);
        if (selfEvaluationScore !== null) {
            selfEvaluationGrade = await (0, self_evaluation_utils_1.자기평가_등급을_조회한다)(evaluationPeriodId, selfEvaluationScore, evaluationPeriodRepository);
        }
    }
    return {
        totalScore: selfEvaluationScore,
        grade: selfEvaluationGrade,
    };
}
async function calculatePrimaryDownwardEvaluationScore(evaluationPeriodId, employeeId, evaluationLineMappingRepository, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository) {
    let primaryDownwardScore = null;
    let primaryDownwardGrade = null;
    const primaryEvaluatorMapping = await evaluationLineMappingRepository
        .createQueryBuilder('mapping')
        .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', { evaluationPeriodId })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
    })
        .andWhere('mapping.deletedAt IS NULL')
        .getOne();
    if (primaryEvaluatorMapping) {
        const primaryEvaluatorId = primaryEvaluatorMapping.evaluatorId;
        const primaryAssignedMappings = await evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .select(['mapping.id', 'mapping.wbsItemId'])
            .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', { evaluationPeriodId })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.evaluatorId = :evaluatorId', {
            evaluatorId: primaryEvaluatorId,
        })
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
        })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('mapping.wbsItemId IS NOT NULL')
            .getRawMany();
        const primaryAssignedCount = primaryAssignedMappings.length;
        const primaryAssignedWbsIds = primaryAssignedMappings.map((m) => m.mapping_wbsItemId);
        let primaryCompletedCount = 0;
        if (primaryAssignedWbsIds.length > 0) {
            primaryCompletedCount = await downwardEvaluationRepository
                .createQueryBuilder('eval')
                .where('eval.periodId = :periodId', { periodId: evaluationPeriodId })
                .andWhere('eval.employeeId = :employeeId', { employeeId })
                .andWhere('eval.evaluatorId = :evaluatorId', {
                evaluatorId: primaryEvaluatorId,
            })
                .andWhere('eval.wbsId IN (:...wbsIds)', {
                wbsIds: primaryAssignedWbsIds,
            })
                .andWhere('eval.evaluationType = :evaluationType', {
                evaluationType: downward_evaluation_types_1.DownwardEvaluationType.PRIMARY,
            })
                .andWhere('eval.isCompleted = :isCompleted', {
                isCompleted: true,
            })
                .andWhere('eval.deletedAt IS NULL')
                .getCount();
        }
        if (primaryAssignedCount > 0 &&
            primaryCompletedCount === primaryAssignedCount) {
            primaryDownwardScore = await (0, downward_evaluation_score_utils_1.가중치_기반_1차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, primaryEvaluatorId, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository);
            if (primaryDownwardScore !== null) {
                primaryDownwardGrade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, primaryDownwardScore, evaluationPeriodRepository);
            }
        }
    }
    return {
        totalScore: primaryDownwardScore,
        grade: primaryDownwardGrade,
    };
}
async function calculateSecondaryDownwardEvaluationScore(evaluationPeriodId, employeeId, evaluationLineMappingRepository, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository) {
    let secondaryDownwardScore = null;
    let secondaryDownwardGrade = null;
    const secondaryEvaluatorMappings = await evaluationLineMappingRepository
        .createQueryBuilder('mapping')
        .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', { evaluationPeriodId })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
    })
        .andWhere('mapping.deletedAt IS NULL')
        .getMany();
    if (secondaryEvaluatorMappings.length > 0) {
        const secondaryEvaluatorIds = [
            ...new Set(secondaryEvaluatorMappings.map((m) => m.evaluatorId)),
        ];
        const evaluatorStats = await Promise.all(secondaryEvaluatorIds.map(async (evaluatorId) => {
            const assignedMappings = await evaluationLineMappingRepository
                .createQueryBuilder('mapping')
                .select(['mapping.id', 'mapping.wbsItemId'])
                .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
                .where('mapping.evaluationPeriodId = :evaluationPeriodId', { evaluationPeriodId })
                .andWhere('mapping.employeeId = :employeeId', { employeeId })
                .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
                .andWhere('line.evaluatorType = :evaluatorType', {
                evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
            })
                .andWhere('mapping.deletedAt IS NULL')
                .andWhere('mapping.wbsItemId IS NOT NULL')
                .getRawMany();
            const assignedCount = assignedMappings.length;
            const assignedWbsIds = assignedMappings.map((m) => m.mapping_wbsItemId);
            let completedCount = 0;
            if (assignedWbsIds.length > 0) {
                completedCount = await downwardEvaluationRepository
                    .createQueryBuilder('eval')
                    .where('eval.periodId = :periodId', {
                    periodId: evaluationPeriodId,
                })
                    .andWhere('eval.employeeId = :employeeId', { employeeId })
                    .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
                    .andWhere('eval.wbsId IN (:...wbsIds)', { wbsIds: assignedWbsIds })
                    .andWhere('eval.evaluationType = :evaluationType', {
                    evaluationType: downward_evaluation_types_1.DownwardEvaluationType.SECONDARY,
                })
                    .andWhere('eval.isCompleted = :isCompleted', {
                    isCompleted: true,
                })
                    .andWhere('eval.deletedAt IS NULL')
                    .getCount();
            }
            return { evaluatorId, assignedCount, completedCount };
        }));
        const allCompleted = evaluatorStats.every((stat) => stat.assignedCount > 0 && stat.completedCount === stat.assignedCount);
        if (evaluatorStats.length > 0 && allCompleted) {
            secondaryDownwardScore = await (0, downward_evaluation_score_utils_1.가중치_기반_2차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, secondaryEvaluatorIds, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository);
            if (secondaryDownwardScore !== null) {
                secondaryDownwardGrade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, secondaryDownwardScore, evaluationPeriodRepository);
            }
        }
    }
    return {
        totalScore: secondaryDownwardScore,
        grade: secondaryDownwardGrade,
    };
}
//# sourceMappingURL=summary-calculation.utils.js.map