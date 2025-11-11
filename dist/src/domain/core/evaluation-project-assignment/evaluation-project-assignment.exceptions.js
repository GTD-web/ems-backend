"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidEvaluationProjectAssignmentDataFormatException = exports.EvaluationProjectAssignmentRequiredDataMissingException = exports.EvaluationProjectAssignmentDuplicateException = exports.EvaluationProjectAssignmentBusinessRuleViolationException = exports.EvaluationPeriodExpiredException = exports.EvaluationProjectAssignmentStatusChangeException = exports.EvaluationProjectAssignmentPermissionDeniedException = exports.DuplicateEvaluationProjectAssignmentException = exports.EvaluationProjectAssignmentNotFoundException = exports.EvaluationProjectAssignmentDomainException = void 0;
class EvaluationProjectAssignmentDomainException extends Error {
    code;
    constructor(message, code = 'EVALUATION_PROJECT_ASSIGNMENT_DOMAIN_ERROR') {
        super(message);
        this.code = code;
        this.name = 'EvaluationProjectAssignmentDomainException';
    }
}
exports.EvaluationProjectAssignmentDomainException = EvaluationProjectAssignmentDomainException;
class EvaluationProjectAssignmentNotFoundException extends EvaluationProjectAssignmentDomainException {
    constructor(assignmentId) {
        super(`평가 프로젝트 할당을 찾을 수 없습니다. ID: ${assignmentId}`, 'EVALUATION_PROJECT_ASSIGNMENT_NOT_FOUND');
        this.name = 'EvaluationProjectAssignmentNotFoundException';
    }
}
exports.EvaluationProjectAssignmentNotFoundException = EvaluationProjectAssignmentNotFoundException;
class DuplicateEvaluationProjectAssignmentException extends EvaluationProjectAssignmentDomainException {
    constructor(periodId, employeeId, projectId) {
        super(`이미 해당 평가기간에 직원에게 프로젝트가 할당되어 있습니다. 평가기간: ${periodId}, 직원: ${employeeId}, 프로젝트: ${projectId}`, 'DUPLICATE_EVALUATION_PROJECT_ASSIGNMENT');
        this.name = 'DuplicateEvaluationProjectAssignmentException';
    }
}
exports.DuplicateEvaluationProjectAssignmentException = DuplicateEvaluationProjectAssignmentException;
class EvaluationProjectAssignmentPermissionDeniedException extends EvaluationProjectAssignmentDomainException {
    constructor(action, userId) {
        super(`평가 프로젝트 할당에 대한 ${action} 권한이 없습니다. 사용자: ${userId}`, 'EVALUATION_PROJECT_ASSIGNMENT_PERMISSION_DENIED');
        this.name = 'EvaluationProjectAssignmentPermissionDeniedException';
    }
}
exports.EvaluationProjectAssignmentPermissionDeniedException = EvaluationProjectAssignmentPermissionDeniedException;
class EvaluationProjectAssignmentStatusChangeException extends EvaluationProjectAssignmentDomainException {
    constructor(currentStatus, targetStatus) {
        super(`현재 상태(${currentStatus})에서 ${targetStatus} 상태로 변경할 수 없습니다.`, 'EVALUATION_PROJECT_ASSIGNMENT_STATUS_CHANGE_ERROR');
        this.name = 'EvaluationProjectAssignmentStatusChangeException';
    }
}
exports.EvaluationProjectAssignmentStatusChangeException = EvaluationProjectAssignmentStatusChangeException;
class EvaluationPeriodExpiredException extends EvaluationProjectAssignmentDomainException {
    constructor(periodId) {
        super(`평가 기간이 만료되어 프로젝트 할당을 변경할 수 없습니다. 평가기간: ${periodId}`, 'EVALUATION_PERIOD_EXPIRED');
        this.name = 'EvaluationPeriodExpiredException';
    }
}
exports.EvaluationPeriodExpiredException = EvaluationPeriodExpiredException;
class EvaluationProjectAssignmentBusinessRuleViolationException extends EvaluationProjectAssignmentDomainException {
    constructor(message) {
        super(message, 'EVALUATION_PROJECT_ASSIGNMENT_BUSINESS_RULE_VIOLATION');
        this.name = 'EvaluationProjectAssignmentBusinessRuleViolationException';
    }
}
exports.EvaluationProjectAssignmentBusinessRuleViolationException = EvaluationProjectAssignmentBusinessRuleViolationException;
class EvaluationProjectAssignmentDuplicateException extends DuplicateEvaluationProjectAssignmentException {
    constructor(periodId, employeeId, projectId) {
        super(periodId, employeeId, projectId);
        this.name = 'EvaluationProjectAssignmentDuplicateException';
    }
}
exports.EvaluationProjectAssignmentDuplicateException = EvaluationProjectAssignmentDuplicateException;
class EvaluationProjectAssignmentRequiredDataMissingException extends EvaluationProjectAssignmentDomainException {
    constructor(message) {
        super(message, 'EVALUATION_PROJECT_ASSIGNMENT_REQUIRED_DATA_MISSING');
        this.name = 'EvaluationProjectAssignmentRequiredDataMissingException';
    }
}
exports.EvaluationProjectAssignmentRequiredDataMissingException = EvaluationProjectAssignmentRequiredDataMissingException;
class InvalidEvaluationProjectAssignmentDataFormatException extends EvaluationProjectAssignmentDomainException {
    constructor(fieldName, expectedFormat, actualValue) {
        super(`${fieldName} 필드의 형식이 올바르지 않습니다. 예상 형식: ${expectedFormat}, 실제 값: ${actualValue}`, 'INVALID_EVALUATION_PROJECT_ASSIGNMENT_DATA_FORMAT');
        this.name = 'InvalidEvaluationProjectAssignmentDataFormatException';
    }
}
exports.InvalidEvaluationProjectAssignmentDataFormatException = InvalidEvaluationProjectAssignmentDataFormatException;
//# sourceMappingURL=evaluation-project-assignment.exceptions.js.map