"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidSecondaryStatusTransitionException = exports.SecondaryStepApprovalNotFoundByMappingAndEvaluatorException = exports.SecondaryEvaluationStepApprovalNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class SecondaryEvaluationStepApprovalNotFoundException extends common_1.NotFoundException {
    constructor(id) {
        super(`2차 평가자별 단계 승인을 찾을 수 없습니다. (ID: ${id})`);
    }
}
exports.SecondaryEvaluationStepApprovalNotFoundException = SecondaryEvaluationStepApprovalNotFoundException;
class SecondaryStepApprovalNotFoundByMappingAndEvaluatorException extends common_1.NotFoundException {
    constructor(mappingId, evaluatorId) {
        super(`해당 맵핑과 평가자에 대한 2차 평가자별 단계 승인 정보를 찾을 수 없습니다. (맵핑 ID: ${mappingId}, 평가자 ID: ${evaluatorId})`);
    }
}
exports.SecondaryStepApprovalNotFoundByMappingAndEvaluatorException = SecondaryStepApprovalNotFoundByMappingAndEvaluatorException;
class InvalidSecondaryStatusTransitionException extends common_1.BadRequestException {
    constructor(currentStatus, targetStatus, reason) {
        super(`2차 평가자별 단계 승인 상태를 ${currentStatus}에서 ${targetStatus}(으)로 변경할 수 없습니다.${reason ? ` ${reason}` : ''}`);
    }
}
exports.InvalidSecondaryStatusTransitionException = InvalidSecondaryStatusTransitionException;
//# sourceMappingURL=secondary-evaluation-step-approval.exceptions.js.map