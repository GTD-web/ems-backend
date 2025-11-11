"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidStatusTransitionException = exports.InvalidStepTypeException = exports.StepApprovalNotFoundByMappingException = exports.EmployeeEvaluationStepApprovalNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class EmployeeEvaluationStepApprovalNotFoundException extends common_1.NotFoundException {
    constructor(id) {
        super(`직원 평가 단계 승인을 찾을 수 없습니다. (ID: ${id})`);
    }
}
exports.EmployeeEvaluationStepApprovalNotFoundException = EmployeeEvaluationStepApprovalNotFoundException;
class StepApprovalNotFoundByMappingException extends common_1.NotFoundException {
    constructor(mappingId) {
        super(`해당 맵핑에 대한 단계 승인 정보를 찾을 수 없습니다. (맵핑 ID: ${mappingId})`);
    }
}
exports.StepApprovalNotFoundByMappingException = StepApprovalNotFoundByMappingException;
class InvalidStepTypeException extends common_1.BadRequestException {
    constructor(step) {
        super(`유효하지 않은 평가 단계입니다: ${step}`);
    }
}
exports.InvalidStepTypeException = InvalidStepTypeException;
class InvalidStatusTransitionException extends common_1.BadRequestException {
    constructor(step, currentStatus, targetStatus, reason) {
        super(`${step} 단계의 상태를 ${currentStatus}에서 ${targetStatus}(으)로 변경할 수 없습니다.${reason ? ` ${reason}` : ''}`);
    }
}
exports.InvalidStatusTransitionException = InvalidStatusTransitionException;
//# sourceMappingURL=employee-evaluation-step-approval.exceptions.js.map