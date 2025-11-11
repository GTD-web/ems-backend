"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.자기평가_진행_상태를_조회한다 = 자기평가_진행_상태를_조회한다;
exports.자기평가_상태를_계산한다 = 자기평가_상태를_계산한다;
exports.가중치_기반_자기평가_점수를_계산한다 = 가중치_기반_자기평가_점수를_계산한다;
exports.자기평가_등급을_조회한다 = 자기평가_등급을_조회한다;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const logger = new common_1.Logger('SelfEvaluationUtils');
async function 자기평가_진행_상태를_조회한다(evaluationPeriodId, employeeId, wbsSelfEvaluationRepository, wbsAssignmentRepository, periodRepository) {
    const totalMappingCount = await wbsSelfEvaluationRepository.count({
        where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const completedMappingCount = await wbsSelfEvaluationRepository.count({
        where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            submittedToManager: true,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const submittedToEvaluatorCount = await wbsSelfEvaluationRepository.count({
        where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            submittedToEvaluator: true,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const isSubmittedToEvaluator = totalMappingCount > 0 &&
        submittedToEvaluatorCount === totalMappingCount;
    const submittedToManagerCount = completedMappingCount;
    const isSubmittedToManager = totalMappingCount > 0 &&
        submittedToManagerCount === totalMappingCount;
    let totalScore = null;
    let grade = null;
    if (totalMappingCount > 0 && completedMappingCount === totalMappingCount) {
        totalScore = await 가중치_기반_자기평가_점수를_계산한다(evaluationPeriodId, employeeId, wbsSelfEvaluationRepository, wbsAssignmentRepository, periodRepository);
        if (totalScore !== null) {
            grade = await 자기평가_등급을_조회한다(evaluationPeriodId, totalScore, periodRepository);
        }
    }
    return {
        totalMappingCount,
        completedMappingCount,
        submittedToEvaluatorCount,
        isSubmittedToEvaluator,
        submittedToManagerCount,
        isSubmittedToManager,
        totalScore,
        grade,
    };
}
function 자기평가_상태를_계산한다(totalMappingCount, completedMappingCount) {
    if (totalMappingCount === 0) {
        return 'none';
    }
    if (completedMappingCount === totalMappingCount) {
        return 'complete';
    }
    else {
        return 'in_progress';
    }
}
async function 가중치_기반_자기평가_점수를_계산한다(evaluationPeriodId, employeeId, wbsSelfEvaluationRepository, wbsAssignmentRepository, periodRepository) {
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
        const maxSelfEvaluationRate = period.maxSelfEvaluationRate;
        const selfEvaluations = await wbsSelfEvaluationRepository.find({
            where: {
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                submittedToManager: true,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        if (selfEvaluations.length === 0) {
            return null;
        }
        const wbsItemIds = selfEvaluations.map((se) => se.wbsItemId);
        const wbsAssignments = await wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .where('assignment.periodId = :periodId', {
            periodId: evaluationPeriodId,
        })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
            .andWhere('assignment.deletedAt IS NULL')
            .getMany();
        const weightMap = new Map();
        wbsAssignments.forEach((assignment) => {
            weightMap.set(assignment.wbsItemId, assignment.weight);
        });
        let totalWeightedScore = 0;
        let totalWeight = 0;
        selfEvaluations.forEach((evaluation) => {
            const weight = weightMap.get(evaluation.wbsItemId) || 0;
            const score = evaluation.selfEvaluationScore || 0;
            const normalizedScore = (score / maxSelfEvaluationRate) * 100;
            totalWeightedScore += (weight / 100) * normalizedScore;
            totalWeight += weight;
        });
        if (totalWeight === 0) {
            return null;
        }
        const finalScore = totalWeightedScore;
        logger.log(`가중치 기반 자기평가 점수 계산 완료: ${finalScore.toFixed(2)} (직원: ${employeeId}, 평가기간: ${evaluationPeriodId})`);
        return Math.round(finalScore * 100) / 100;
    }
    catch (error) {
        logger.error(`가중치 기반 자기평가 점수 계산 실패: ${error.message}`, error.stack);
        return null;
    }
}
async function 자기평가_등급을_조회한다(evaluationPeriodId, totalScore, periodRepository) {
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
        logger.log(`자기평가 등급 조회 완료: ${gradeMapping.finalGrade} (점수: ${totalScore}, 평가기간: ${evaluationPeriodId})`);
        return gradeMapping.finalGrade;
    }
    catch (error) {
        logger.error(`자기평가 등급 조회 실패: ${error.message}`, error.stack);
        return null;
    }
}
//# sourceMappingURL=self-evaluation.utils.js.map