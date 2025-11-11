"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.평가라인_지정_여부를_확인한다 = 평가라인_지정_여부를_확인한다;
exports.평가라인_상태를_계산한다 = 평가라인_상태를_계산한다;
const typeorm_1 = require("typeorm");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
async function 평가라인_지정_여부를_확인한다(evaluationPeriodId, employeeId, evaluationLineRepository, evaluationLineMappingRepository) {
    const primaryLine = await evaluationLineRepository.findOne({
        where: {
            evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const secondaryLine = await evaluationLineRepository.findOne({
        where: {
            evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    let hasPrimaryEvaluator = false;
    let hasSecondaryEvaluator = false;
    if (primaryLine) {
        const primaryMapping = await evaluationLineMappingRepository.findOne({
            where: {
                evaluationPeriodId: evaluationPeriodId,
                employeeId: employeeId,
                evaluationLineId: primaryLine.id,
                wbsItemId: (0, typeorm_1.IsNull)(),
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        hasPrimaryEvaluator = !!primaryMapping;
    }
    if (secondaryLine) {
        const secondaryMapping = await evaluationLineMappingRepository.findOne({
            where: {
                evaluationPeriodId: evaluationPeriodId,
                employeeId: employeeId,
                evaluationLineId: secondaryLine.id,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        hasSecondaryEvaluator = !!secondaryMapping;
    }
    return { hasPrimaryEvaluator, hasSecondaryEvaluator };
}
function 평가라인_상태를_계산한다(hasPrimaryEvaluator, hasSecondaryEvaluator) {
    if (hasPrimaryEvaluator && hasSecondaryEvaluator) {
        return 'complete';
    }
    else if (hasPrimaryEvaluator || hasSecondaryEvaluator) {
        return 'in_progress';
    }
    else {
        return 'none';
    }
}
//# sourceMappingURL=evaluation-line.utils.js.map