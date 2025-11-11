"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletedEvaluationPeriodAssignmentException = exports.ProjectAssignmentPrerequisiteException = exports.InvalidEvaluationWbsAssignmentDataFormatException = exports.EvaluationWbsAssignmentRequiredDataMissingException = exports.EvaluationWbsAssignmentDuplicateException = exports.EvaluationWbsAssignmentBusinessRuleViolationException = exports.EvaluationPeriodExpiredException = exports.WbsItemProjectMismatchException = exports.InvalidWorkHoursException = exports.EvaluationWbsAssignmentStatusChangeException = exports.EvaluationWbsAssignmentPermissionDeniedException = exports.DuplicateEvaluationWbsAssignmentException = exports.EvaluationWbsAssignmentNotFoundException = exports.EvaluationWbsAssignmentDomainException = void 0;
class EvaluationWbsAssignmentDomainException extends Error {
    code;
    constructor(message, code = 'EVALUATION_WBS_ASSIGNMENT_DOMAIN_ERROR') {
        super(message);
        this.code = code;
        this.name = 'EvaluationWbsAssignmentDomainException';
    }
}
exports.EvaluationWbsAssignmentDomainException = EvaluationWbsAssignmentDomainException;
class EvaluationWbsAssignmentNotFoundException extends EvaluationWbsAssignmentDomainException {
    constructor(assignmentId) {
        super(`평가 WBS 할당을 찾을 수 없습니다. ID: ${assignmentId}`, 'EVALUATION_WBS_ASSIGNMENT_NOT_FOUND');
        this.name = 'EvaluationWbsAssignmentNotFoundException';
    }
}
exports.EvaluationWbsAssignmentNotFoundException = EvaluationWbsAssignmentNotFoundException;
class DuplicateEvaluationWbsAssignmentException extends EvaluationWbsAssignmentDomainException {
    constructor(periodId, employeeId, projectId, wbsItemId) {
        super(`이미 해당 평가기간에 직원에게 WBS 항목이 할당되어 있습니다. 평가기간: ${periodId}, 직원: ${employeeId}, 프로젝트: ${projectId}, WBS: ${wbsItemId}`, 'DUPLICATE_EVALUATION_WBS_ASSIGNMENT');
        this.name = 'DuplicateEvaluationWbsAssignmentException';
    }
}
exports.DuplicateEvaluationWbsAssignmentException = DuplicateEvaluationWbsAssignmentException;
class EvaluationWbsAssignmentPermissionDeniedException extends EvaluationWbsAssignmentDomainException {
    constructor(action, userId) {
        super(`평가 WBS 할당에 대한 ${action} 권한이 없습니다. 사용자: ${userId}`, 'EVALUATION_WBS_ASSIGNMENT_PERMISSION_DENIED');
        this.name = 'EvaluationWbsAssignmentPermissionDeniedException';
    }
}
exports.EvaluationWbsAssignmentPermissionDeniedException = EvaluationWbsAssignmentPermissionDeniedException;
class EvaluationWbsAssignmentStatusChangeException extends EvaluationWbsAssignmentDomainException {
    constructor(currentStatus, targetStatus) {
        super(`현재 상태(${currentStatus})에서 ${targetStatus} 상태로 변경할 수 없습니다.`, 'EVALUATION_WBS_ASSIGNMENT_STATUS_CHANGE_ERROR');
        this.name = 'EvaluationWbsAssignmentStatusChangeException';
    }
}
exports.EvaluationWbsAssignmentStatusChangeException = EvaluationWbsAssignmentStatusChangeException;
class InvalidWorkHoursException extends EvaluationWbsAssignmentDomainException {
    constructor(hours) {
        super(`잘못된 작업 시간입니다. 작업 시간은 0 이상이어야 합니다. 입력값: ${hours}`, 'INVALID_WORK_HOURS');
        this.name = 'InvalidWorkHoursException';
    }
}
exports.InvalidWorkHoursException = InvalidWorkHoursException;
class WbsItemProjectMismatchException extends EvaluationWbsAssignmentDomainException {
    constructor(wbsItemId, expectedProjectId, actualProjectId) {
        super(`WBS 항목의 프로젝트가 일치하지 않습니다. WBS: ${wbsItemId}, 예상 프로젝트: ${expectedProjectId}, 실제 프로젝트: ${actualProjectId}`, 'WBS_ITEM_PROJECT_MISMATCH');
        this.name = 'WbsItemProjectMismatchException';
    }
}
exports.WbsItemProjectMismatchException = WbsItemProjectMismatchException;
class EvaluationPeriodExpiredException extends EvaluationWbsAssignmentDomainException {
    constructor(periodId) {
        super(`평가 기간이 만료되어 WBS 할당을 변경할 수 없습니다. 평가기간: ${periodId}`, 'EVALUATION_PERIOD_EXPIRED');
        this.name = 'EvaluationPeriodExpiredException';
    }
}
exports.EvaluationPeriodExpiredException = EvaluationPeriodExpiredException;
class EvaluationWbsAssignmentBusinessRuleViolationException extends EvaluationWbsAssignmentDomainException {
    constructor(message) {
        super(message, 'EVALUATION_WBS_ASSIGNMENT_BUSINESS_RULE_VIOLATION');
        this.name = 'EvaluationWbsAssignmentBusinessRuleViolationException';
    }
}
exports.EvaluationWbsAssignmentBusinessRuleViolationException = EvaluationWbsAssignmentBusinessRuleViolationException;
class EvaluationWbsAssignmentDuplicateException extends DuplicateEvaluationWbsAssignmentException {
    constructor(periodId, employeeId, projectId, wbsItemId) {
        super(periodId, employeeId, projectId, wbsItemId);
        this.name = 'EvaluationWbsAssignmentDuplicateException';
    }
}
exports.EvaluationWbsAssignmentDuplicateException = EvaluationWbsAssignmentDuplicateException;
class EvaluationWbsAssignmentRequiredDataMissingException extends EvaluationWbsAssignmentDomainException {
    constructor(message) {
        super(message, 'EVALUATION_WBS_ASSIGNMENT_REQUIRED_DATA_MISSING');
        this.name = 'EvaluationWbsAssignmentRequiredDataMissingException';
    }
}
exports.EvaluationWbsAssignmentRequiredDataMissingException = EvaluationWbsAssignmentRequiredDataMissingException;
class InvalidEvaluationWbsAssignmentDataFormatException extends EvaluationWbsAssignmentDomainException {
    constructor(fieldName, expectedFormat, actualValue) {
        super(`${fieldName} 필드의 형식이 올바르지 않습니다. 예상 형식: ${expectedFormat}, 실제 값: ${actualValue}`, 'INVALID_EVALUATION_WBS_ASSIGNMENT_DATA_FORMAT');
        this.name = 'InvalidEvaluationWbsAssignmentDataFormatException';
    }
}
exports.InvalidEvaluationWbsAssignmentDataFormatException = InvalidEvaluationWbsAssignmentDataFormatException;
class ProjectAssignmentPrerequisiteException extends EvaluationWbsAssignmentDomainException {
    constructor(periodId, employeeId, projectId) {
        super(`프로젝트 할당이 없으면 WBS 할당을 생성할 수 없습니다. 평가기간: ${periodId}, 직원: ${employeeId}, 프로젝트: ${projectId}`, 'PROJECT_ASSIGNMENT_PREREQUISITE_NOT_MET');
        this.name = 'ProjectAssignmentPrerequisiteException';
    }
}
exports.ProjectAssignmentPrerequisiteException = ProjectAssignmentPrerequisiteException;
class CompletedEvaluationPeriodAssignmentException extends EvaluationWbsAssignmentDomainException {
    constructor(periodId, action) {
        super(`완료된 평가기간에는 ${action}할 수 없습니다. 평가기간: ${periodId}`, 'COMPLETED_EVALUATION_PERIOD_ASSIGNMENT');
        this.name = 'CompletedEvaluationPeriodAssignmentException';
    }
}
exports.CompletedEvaluationPeriodAssignmentException = CompletedEvaluationPeriodAssignmentException;
//# sourceMappingURL=evaluation-wbs-assignment.exceptions.js.map