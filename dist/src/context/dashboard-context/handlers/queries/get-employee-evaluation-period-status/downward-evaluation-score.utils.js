"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.가중치_기반_1차_하향평가_점수를_계산한다 = 가중치_기반_1차_하향평가_점수를_계산한다;
exports.가중치_기반_2차_하향평가_점수를_계산한다 = 가중치_기반_2차_하향평가_점수를_계산한다;
exports.하향평가_등급을_조회한다 = 하향평가_등급을_조회한다;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
const logger = new common_1.Logger('DownwardEvaluationScoreUtils');
async function 가중치_기반_1차_하향평가_점수를_계산한다(evaluationPeriodId, employeeId, evaluatorId, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository) {
    try {
        if (!evaluatorId) {
            logger.warn(`1차 평가자가 지정되지 않았습니다. (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`);
            return null;
        }
        const downwardEvaluations = await downwardEvaluationRepository.find({
            where: {
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                evaluatorId: evaluatorId,
                evaluationType: downward_evaluation_types_1.DownwardEvaluationType.PRIMARY,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        const completedEvaluations = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가() &&
            evaluation.downwardEvaluationScore !== null &&
            evaluation.downwardEvaluationScore !== undefined);
        if (completedEvaluations.length === 0) {
            return null;
        }
        const wbsIds = completedEvaluations.map((de) => de.wbsId);
        const wbsAssignments = await wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .where('assignment.periodId = :periodId', {
            periodId: evaluationPeriodId,
        })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.wbsItemId IN (:...wbsIds)', { wbsIds })
            .andWhere('assignment.deletedAt IS NULL')
            .getMany();
        const evaluationPeriod = await evaluationPeriodRepository.findOne({
            where: { id: evaluationPeriodId },
        });
        const maxRate = evaluationPeriod?.maxSelfEvaluationRate || 100;
        const weightMap = new Map();
        wbsAssignments.forEach((assignment) => {
            weightMap.set(assignment.wbsItemId, assignment.weight);
        });
        let totalWeightedScore = 0;
        let totalWeight = 0;
        completedEvaluations.forEach((evaluation) => {
            const weight = weightMap.get(evaluation.wbsId) || 0;
            const score = evaluation.downwardEvaluationScore || 0;
            const normalizedScore = (score / maxRate) * 100;
            totalWeightedScore += (weight / 100) * normalizedScore;
            totalWeight += weight;
        });
        if (totalWeight === 0) {
            return null;
        }
        const finalScore = totalWeightedScore;
        logger.log(`가중치 기반 1차 하향평가 점수 계산 완료: ${finalScore.toFixed(2)} (피평가자: ${employeeId}, 평가자: ${evaluatorId}, 평가기간: ${evaluationPeriodId})`);
        return Math.round(finalScore * 100) / 100;
    }
    catch (error) {
        logger.error(`가중치 기반 1차 하향평가 점수 계산 실패: ${error.message}`, error.stack);
        return null;
    }
}
async function 가중치_기반_2차_하향평가_점수를_계산한다(evaluationPeriodId, employeeId, evaluatorIds, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository) {
    try {
        if (evaluatorIds.length === 0) {
            logger.warn(`2차 평가자가 지정되지 않았습니다. (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`);
            return null;
        }
        const downwardEvaluations = await downwardEvaluationRepository.find({
            where: {
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                evaluatorId: (0, typeorm_1.In)(evaluatorIds),
                evaluationType: downward_evaluation_types_1.DownwardEvaluationType.SECONDARY,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        const completedEvaluations = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가() &&
            evaluation.downwardEvaluationScore !== null &&
            evaluation.downwardEvaluationScore !== undefined);
        if (completedEvaluations.length === 0) {
            return null;
        }
        const wbsIds = [...new Set(completedEvaluations.map((de) => de.wbsId))];
        const wbsAssignments = await wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .where('assignment.periodId = :periodId', {
            periodId: evaluationPeriodId,
        })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.wbsItemId IN (:...wbsIds)', { wbsIds })
            .andWhere('assignment.deletedAt IS NULL')
            .getMany();
        const evaluationPeriod = await evaluationPeriodRepository.findOne({
            where: { id: evaluationPeriodId },
        });
        const maxRate = evaluationPeriod?.maxSelfEvaluationRate || 100;
        const weightMap = new Map();
        wbsAssignments.forEach((assignment) => {
            weightMap.set(assignment.wbsItemId, assignment.weight);
        });
        const wbsScoresMap = new Map();
        completedEvaluations.forEach((evaluation) => {
            if (!wbsScoresMap.has(evaluation.wbsId)) {
                wbsScoresMap.set(evaluation.wbsId, []);
            }
            wbsScoresMap
                .get(evaluation.wbsId)
                .push(evaluation.downwardEvaluationScore || 0);
        });
        let totalWeightedScore = 0;
        let totalWeight = 0;
        wbsScoresMap.forEach((scores, wbsId) => {
            const weight = weightMap.get(wbsId) || 0;
            const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const normalizedScore = (averageScore / maxRate) * 100;
            totalWeightedScore += (weight / 100) * normalizedScore;
            totalWeight += weight;
        });
        if (totalWeight === 0) {
            return null;
        }
        const finalScore = totalWeightedScore;
        logger.log(`가중치 기반 2차 하향평가 점수 계산 완료: ${finalScore.toFixed(2)} (피평가자: ${employeeId}, 평가자 수: ${evaluatorIds.length}, 평가기간: ${evaluationPeriodId})`);
        return Math.round(finalScore * 100) / 100;
    }
    catch (error) {
        logger.error(`가중치 기반 2차 하향평가 점수 계산 실패: ${error.message}`, error.stack);
        return null;
    }
}
async function 하향평가_등급을_조회한다(evaluationPeriodId, totalScore, periodRepository) {
    try {
        const period = await periodRepository.findOne({
            where: {
                id: evaluationPeriodId,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        if (!period) {
            logger.warn(`평가기간을 찾을 수 없습니다: ${evaluationPeriodId}`);
            return null;
        }
        if (!period.등급구간_설정됨()) {
            logger.warn(`평가기간에 등급 구간이 설정되지 않았습니다: ${evaluationPeriodId}`);
            return null;
        }
        const gradeMapping = period.점수로_등급_조회한다(totalScore);
        if (!gradeMapping) {
            logger.warn(`점수에 해당하는 등급을 찾을 수 없습니다: ${totalScore} (평가기간: ${evaluationPeriodId})`);
            return null;
        }
        logger.log(`하향평가 등급 조회 완료: ${gradeMapping.finalGrade} (점수: ${totalScore}, 평가기간: ${evaluationPeriodId})`);
        return gradeMapping.finalGrade;
    }
    catch (error) {
        logger.error(`하향평가 등급 조회 실패: ${error.message}`, error.stack);
        return null;
    }
}
//# sourceMappingURL=downward-evaluation-score.utils.js.map