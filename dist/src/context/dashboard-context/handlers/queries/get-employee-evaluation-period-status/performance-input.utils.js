"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.성과입력_상태를_조회한다 = 성과입력_상태를_조회한다;
exports.성과입력_상태를_계산한다 = 성과입력_상태를_계산한다;
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
async function 성과입력_상태를_조회한다(evaluationPeriodId, employeeId, wbsSelfEvaluationRepository) {
    const totalWbsCount = await wbsSelfEvaluationRepository
        .createQueryBuilder('evaluation')
        .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = evaluation.wbsItemId AND wbs.deletedAt IS NULL')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
        .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = evaluation.periodId AND projectAssignment.employeeId = evaluation.employeeId AND projectAssignment.deletedAt IS NULL')
        .where('evaluation.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('evaluation.employeeId = :employeeId', { employeeId })
        .andWhere('evaluation.deletedAt IS NULL')
        .andWhere('project.id IS NOT NULL')
        .andWhere('projectAssignment.id IS NOT NULL')
        .getCount();
    const selfEvaluations = await wbsSelfEvaluationRepository
        .createQueryBuilder('evaluation')
        .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = evaluation.wbsItemId AND wbs.deletedAt IS NULL')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
        .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = evaluation.periodId AND projectAssignment.employeeId = evaluation.employeeId AND projectAssignment.deletedAt IS NULL')
        .where('evaluation.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('evaluation.employeeId = :employeeId', { employeeId })
        .andWhere('evaluation.deletedAt IS NULL')
        .andWhere('project.id IS NOT NULL')
        .andWhere('projectAssignment.id IS NOT NULL')
        .getMany();
    const inputCompletedCount = selfEvaluations.filter((evaluation) => evaluation.performanceResult &&
        evaluation.performanceResult.trim().length > 0).length;
    return { totalWbsCount, inputCompletedCount };
}
function 성과입력_상태를_계산한다(totalWbsCount, inputCompletedCount) {
    if (totalWbsCount === 0) {
        return 'none';
    }
    if (inputCompletedCount === 0) {
        return 'none';
    }
    else if (inputCompletedCount === totalWbsCount) {
        return 'complete';
    }
    else {
        return 'in_progress';
    }
}
//# sourceMappingURL=performance-input.utils.js.map