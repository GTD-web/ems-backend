"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.하향평가_통합_상태를_계산한다 = 하향평가_통합_상태를_계산한다;
exports.이차평가_전체_상태를_계산한다 = 이차평가_전체_상태를_계산한다;
exports.하향평가_상태를_조회한다 = 하향평가_상태를_조회한다;
exports.평가자별_하향평가_상태를_조회한다 = 평가자별_하향평가_상태를_조회한다;
exports.특정_평가자의_하향평가_상태를_조회한다 = 특정_평가자의_하향평가_상태를_조회한다;
const typeorm_1 = require("typeorm");
const evaluation_line_entity_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
const downward_evaluation_score_utils_1 = require("./downward-evaluation-score.utils");
function 하향평가_통합_상태를_계산한다(downwardStatus, approvalStatus) {
    if (approvalStatus === 'revision_requested') {
        return 'revision_requested';
    }
    if (approvalStatus === 'revision_completed') {
        return 'revision_completed';
    }
    if (downwardStatus === 'none') {
        return 'none';
    }
    if (downwardStatus === 'in_progress') {
        return 'in_progress';
    }
    if (approvalStatus === 'approved') {
        return 'approved';
    }
    return approvalStatus || 'pending';
}
function 이차평가_전체_상태를_계산한다(evaluatorStatuses) {
    if (evaluatorStatuses.length === 0 ||
        evaluatorStatuses.every((s) => s === 'none')) {
        return 'none';
    }
    if (evaluatorStatuses.some((s) => s === 'revision_completed')) {
        return 'revision_completed';
    }
    if (evaluatorStatuses.some((s) => s === 'revision_requested')) {
        return 'revision_requested';
    }
    if (evaluatorStatuses.some((s) => s === 'pending')) {
        return 'pending';
    }
    const hasInProgress = evaluatorStatuses.some((s) => s === 'in_progress' || s === 'complete');
    if (hasInProgress &&
        evaluatorStatuses.some((s) => s === 'none' || s === 'in_progress')) {
        return 'in_progress';
    }
    const allCompleteOrAbove = evaluatorStatuses.every((s) => s === 'complete' || s === 'pending' || s === 'approved');
    if (allCompleteOrAbove) {
        if (evaluatorStatuses.every((s) => s === 'pending')) {
            return 'pending';
        }
        if (evaluatorStatuses.every((s) => s === 'approved')) {
            return 'approved';
        }
        if (evaluatorStatuses.some((s) => s === 'pending')) {
            return 'pending';
        }
        return 'in_progress';
    }
    return 'in_progress';
}
async function 하향평가_상태를_조회한다(evaluationPeriodId, employeeId, evaluationLineRepository, evaluationLineMappingRepository, downwardEvaluationRepository, wbsAssignmentRepository, periodRepository, employeeRepository) {
    const primaryLine = await evaluationLineRepository.findOne({
        where: {
            evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const primaryEvaluators = [];
    if (primaryLine) {
        const primaryMappings = await evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.evaluationLineId = :lineId', {
            lineId: primaryLine.id,
        })
            .andWhere('mapping.wbsItemId IS NULL')
            .andWhere('mapping.deletedAt IS NULL')
            .orderBy('mapping.createdAt', 'ASC')
            .getMany();
        const uniqueEvaluatorIds = [
            ...new Set(primaryMappings.map((m) => m.evaluatorId).filter((id) => !!id)),
        ];
        primaryEvaluators.push(...uniqueEvaluatorIds);
    }
    const primaryEvaluatorId = primaryEvaluators.length > 0 ? primaryEvaluators[0] : null;
    const primaryStatus = await 평가자별_하향평가_상태를_조회한다(evaluationPeriodId, employeeId, downward_evaluation_types_1.DownwardEvaluationType.PRIMARY, primaryEvaluatorId, downwardEvaluationRepository, wbsAssignmentRepository);
    let primaryEvaluatorInfo = null;
    if (primaryEvaluatorId && employeeRepository) {
        const evaluator = await employeeRepository.findOne({
            where: { id: primaryEvaluatorId, deletedAt: (0, typeorm_1.IsNull)() },
            select: [
                'id',
                'name',
                'employeeNumber',
                'email',
                'departmentName',
                'rankName',
            ],
        });
        if (evaluator) {
            primaryEvaluatorInfo = {
                id: evaluator.id,
                name: evaluator.name,
                employeeNumber: evaluator.employeeNumber,
                email: evaluator.email,
                departmentName: evaluator.departmentName || undefined,
                rankName: evaluator.rankName || undefined,
            };
        }
    }
    const secondaryLine = await evaluationLineRepository.findOne({
        where: {
            evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const secondaryEvaluators = [];
    if (secondaryLine) {
        const secondaryMappings = await evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.evaluationLineId = :lineId', {
            lineId: secondaryLine.id,
        })
            .andWhere('mapping.deletedAt IS NULL')
            .orderBy('mapping.createdAt', 'ASC')
            .getMany();
        const uniqueEvaluatorIds = [
            ...new Set(secondaryMappings.map((m) => m.evaluatorId).filter((id) => !!id)),
        ];
        secondaryEvaluators.push(...uniqueEvaluatorIds);
    }
    const secondaryStatuses = await Promise.all(secondaryEvaluators.map(async (evaluatorId) => {
        const status = await 특정_평가자의_하향평가_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorId, downward_evaluation_types_1.DownwardEvaluationType.SECONDARY, downwardEvaluationRepository, wbsAssignmentRepository, evaluationLineMappingRepository, evaluationLineRepository);
        let evaluatorInfo = null;
        if (employeeRepository) {
            const evaluator = await employeeRepository.findOne({
                where: { id: evaluatorId, deletedAt: (0, typeorm_1.IsNull)() },
                select: [
                    'id',
                    'name',
                    'employeeNumber',
                    'email',
                    'departmentName',
                    'rankName',
                ],
            });
            if (evaluator) {
                evaluatorInfo = {
                    id: evaluator.id,
                    name: evaluator.name,
                    employeeNumber: evaluator.employeeNumber,
                    email: evaluator.email,
                    departmentName: evaluator.departmentName || undefined,
                    rankName: evaluator.rankName || undefined,
                };
            }
        }
        return {
            evaluator: evaluatorInfo || {
                id: evaluatorId,
                name: '알 수 없음',
                employeeNumber: 'N/A',
                email: 'N/A',
                departmentName: undefined,
                rankName: undefined,
            },
            status: status.status,
            assignedWbsCount: status.assignedWbsCount,
            completedEvaluationCount: status.completedEvaluationCount,
            isSubmitted: status.isSubmitted,
        };
    }));
    let secondaryTotalScore = null;
    let secondaryGrade = null;
    const allSecondaryEvaluationsCompleted = secondaryStatuses.every((status) => status.assignedWbsCount > 0 &&
        status.completedEvaluationCount === status.assignedWbsCount);
    if (secondaryEvaluators.length > 0 && allSecondaryEvaluationsCompleted) {
        secondaryTotalScore = await (0, downward_evaluation_score_utils_1.가중치_기반_2차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, secondaryEvaluators, downwardEvaluationRepository, wbsAssignmentRepository, periodRepository);
        if (secondaryTotalScore !== null) {
            secondaryGrade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, secondaryTotalScore, periodRepository);
        }
    }
    let primaryTotalScore = null;
    let primaryGrade = null;
    if (primaryStatus.assignedWbsCount > 0 &&
        primaryStatus.completedEvaluationCount === primaryStatus.assignedWbsCount) {
        primaryTotalScore = await (0, downward_evaluation_score_utils_1.가중치_기반_1차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, primaryEvaluators, downwardEvaluationRepository, wbsAssignmentRepository, periodRepository);
        if (primaryTotalScore !== null) {
            primaryGrade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, primaryTotalScore, periodRepository);
        }
    }
    const secondaryIsSubmitted = secondaryStatuses.length > 0 &&
        secondaryStatuses.every((status) => status.isSubmitted);
    return {
        primary: {
            evaluator: primaryEvaluatorInfo,
            status: primaryStatus.status,
            assignedWbsCount: primaryStatus.assignedWbsCount,
            completedEvaluationCount: primaryStatus.completedEvaluationCount,
            isSubmitted: primaryStatus.isSubmitted,
            totalScore: primaryTotalScore,
            grade: primaryGrade,
        },
        secondary: {
            evaluators: secondaryStatuses,
            isSubmitted: secondaryIsSubmitted,
            totalScore: secondaryTotalScore,
            grade: secondaryGrade,
        },
    };
}
async function 평가자별_하향평가_상태를_조회한다(evaluationPeriodId, employeeId, evaluationType, evaluatorId, downwardEvaluationRepository, wbsAssignmentRepository) {
    const assignedWbsCount = await wbsAssignmentRepository.count({
        where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const whereCondition = {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationType: evaluationType,
        deletedAt: (0, typeorm_1.IsNull)(),
    };
    if (evaluatorId) {
        whereCondition.evaluatorId = evaluatorId;
    }
    const downwardEvaluations = await downwardEvaluationRepository.find({
        where: whereCondition,
    });
    const completedEvaluationCount = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가()).length;
    let averageScore = null;
    const completedEvaluations = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가() &&
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined);
    if (completedEvaluations.length > 0) {
        const totalScore = completedEvaluations.reduce((sum, evaluation) => sum + (evaluation.downwardEvaluationScore || 0), 0);
        averageScore = totalScore / completedEvaluations.length;
    }
    let status;
    if (assignedWbsCount === 0) {
        status = 'none';
    }
    else if (downwardEvaluations.length === 0) {
        status = 'none';
    }
    else if (completedEvaluationCount >= assignedWbsCount) {
        status = 'complete';
    }
    else if (completedEvaluationCount > 0 || downwardEvaluations.length > 0) {
        status = 'in_progress';
    }
    else {
        status = 'none';
    }
    const isSubmitted = assignedWbsCount > 0 &&
        completedEvaluationCount === assignedWbsCount &&
        completedEvaluationCount > 0;
    return {
        status,
        assignedWbsCount,
        completedEvaluationCount,
        isSubmitted,
        averageScore,
    };
}
async function 특정_평가자의_하향평가_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorId, evaluationType, downwardEvaluationRepository, wbsAssignmentRepository, evaluationLineMappingRepository, evaluationLineRepository) {
    let assignedWbsCount;
    if (evaluationType === downward_evaluation_types_1.DownwardEvaluationType.SECONDARY) {
        if (!evaluationLineMappingRepository || !evaluationLineRepository) {
            throw new Error('evaluationLineMappingRepository와 evaluationLineRepository가 필요합니다.');
        }
        const secondaryLine = await evaluationLineRepository.findOne({
            where: {
                evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        if (!secondaryLine) {
            assignedWbsCount = 0;
        }
        else {
            const assignedMappings = await evaluationLineMappingRepository
                .createQueryBuilder('mapping')
                .select(['mapping.id', 'mapping.wbsItemId'])
                .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
                .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('mapping.employeeId = :employeeId', { employeeId })
                .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
                .andWhere('line.evaluatorType = :evaluatorType', {
                evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
            })
                .andWhere('mapping.deletedAt IS NULL')
                .andWhere('mapping.wbsItemId IS NOT NULL')
                .getRawMany();
            assignedWbsCount = assignedMappings.length;
        }
    }
    else {
        assignedWbsCount = await wbsAssignmentRepository.count({
            where: {
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
    }
    const downwardEvaluations = await downwardEvaluationRepository.find({
        where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            evaluatorId: evaluatorId,
            evaluationType: evaluationType,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const completedEvaluationCount = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가()).length;
    let averageScore = null;
    const completedEvaluations = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가() &&
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined);
    if (completedEvaluations.length > 0) {
        const totalScore = completedEvaluations.reduce((sum, evaluation) => sum + (evaluation.downwardEvaluationScore || 0), 0);
        averageScore = totalScore / completedEvaluations.length;
    }
    let status;
    if (assignedWbsCount === 0) {
        status = 'none';
    }
    else if (downwardEvaluations.length === 0) {
        status = 'none';
    }
    else if (completedEvaluationCount >= assignedWbsCount) {
        status = 'complete';
    }
    else if (completedEvaluationCount > 0 || downwardEvaluations.length > 0) {
        status = 'in_progress';
    }
    else {
        status = 'none';
    }
    const isSubmitted = assignedWbsCount > 0 &&
        completedEvaluationCount === assignedWbsCount &&
        completedEvaluationCount > 0;
    return {
        status,
        assignedWbsCount,
        completedEvaluationCount,
        isSubmitted,
        averageScore,
    };
}
//# sourceMappingURL=downward-evaluation.utils.js.map