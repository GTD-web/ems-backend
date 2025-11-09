"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.동료평가_상태를_조회한다 = 동료평가_상태를_조회한다;
exports.동료평가_상태를_계산한다 = 동료평가_상태를_계산한다;
const typeorm_1 = require("typeorm");
const peer_evaluation_types_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.types");
async function 동료평가_상태를_조회한다(evaluationPeriodId, employeeId, peerEvaluationRepository) {
    const totalRequestCount = await peerEvaluationRepository.count({
        where: {
            periodId: evaluationPeriodId,
            evaluateeId: employeeId,
            isActive: true,
            status: (0, typeorm_1.Not)(peer_evaluation_types_1.PeerEvaluationStatus.CANCELLED),
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const completedRequestCount = await peerEvaluationRepository.count({
        where: {
            periodId: evaluationPeriodId,
            evaluateeId: employeeId,
            isActive: true,
            isCompleted: true,
            status: (0, typeorm_1.Not)(peer_evaluation_types_1.PeerEvaluationStatus.CANCELLED),
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    return { totalRequestCount, completedRequestCount };
}
function 동료평가_상태를_계산한다(totalRequestCount, completedRequestCount) {
    if (totalRequestCount === 0) {
        return 'none';
    }
    if (completedRequestCount === totalRequestCount) {
        return 'complete';
    }
    return 'in_progress';
}
//# sourceMappingURL=peer-evaluation.utils.js.map