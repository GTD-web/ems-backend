"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.성과입력_상태를_조회한다 = 성과입력_상태를_조회한다;
exports.성과입력_상태를_계산한다 = 성과입력_상태를_계산한다;
const typeorm_1 = require("typeorm");
async function 성과입력_상태를_조회한다(evaluationPeriodId, employeeId, wbsSelfEvaluationRepository) {
    const totalWbsCount = await wbsSelfEvaluationRepository.count({
        where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const selfEvaluations = await wbsSelfEvaluationRepository.find({
        where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
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