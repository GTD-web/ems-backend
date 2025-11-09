"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.최종평가를_조회한다 = 최종평가를_조회한다;
exports.최종평가_상태를_계산한다 = 최종평가_상태를_계산한다;
const typeorm_1 = require("typeorm");
async function 최종평가를_조회한다(evaluationPeriodId, employeeId, finalEvaluationRepository) {
    const finalEvaluation = await finalEvaluationRepository.findOne({
        where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    return finalEvaluation;
}
function 최종평가_상태를_계산한다(finalEvaluation) {
    if (!finalEvaluation) {
        return 'none';
    }
    if (finalEvaluation.isConfirmed) {
        return 'complete';
    }
    return 'in_progress';
}
//# sourceMappingURL=final-evaluation.utils.js.map