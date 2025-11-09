"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidEvaluationLineMappingDataFormatException = exports.EvaluationLineMappingRequiredDataMissingException = exports.EvaluationLineMappingDuplicateException = exports.EvaluationLineMappingBusinessRuleViolationException = exports.EvaluationLineMappingProjectMismatchException = exports.EvaluationLineMappingSelfEvaluationException = exports.EvaluationLineMappingPermissionDeniedException = exports.EvaluationLineMappingNotFoundException = exports.DuplicateEvaluationLineMappingException = exports.EvaluationLineMappingDomainException = void 0;
class EvaluationLineMappingDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'EvaluationLineMappingDomainException';
    }
}
exports.EvaluationLineMappingDomainException = EvaluationLineMappingDomainException;
class DuplicateEvaluationLineMappingException extends EvaluationLineMappingDomainException {
    constructor(employeeId, evaluatorId, projectId) {
        const projectInfo = projectId ? `, 프로젝트 ${projectId}` : '';
        super(`이미 존재하는 평가 라인 맵핑입니다: 피평가자 ${employeeId}, 평가자 ${evaluatorId}${projectInfo}`, 'DUPLICATE_EVALUATION_LINE_MAPPING', 409, { employeeId, evaluatorId, projectId });
        this.name = 'DuplicateEvaluationLineMappingException';
    }
}
exports.DuplicateEvaluationLineMappingException = DuplicateEvaluationLineMappingException;
class EvaluationLineMappingNotFoundException extends EvaluationLineMappingDomainException {
    constructor(identifier) {
        super(`평가 라인 맵핑을 찾을 수 없습니다: ${identifier}`, 'EVALUATION_LINE_MAPPING_NOT_FOUND', 404, { identifier });
        this.name = 'EvaluationLineMappingNotFoundException';
    }
}
exports.EvaluationLineMappingNotFoundException = EvaluationLineMappingNotFoundException;
class EvaluationLineMappingPermissionDeniedException extends EvaluationLineMappingDomainException {
    constructor(userId, action) {
        super(`평가 라인 맵핑에 대한 ${action} 권한이 없습니다: 사용자 ${userId}`, 'EVALUATION_LINE_MAPPING_PERMISSION_DENIED', 403, { userId, action });
        this.name = 'EvaluationLineMappingPermissionDeniedException';
    }
}
exports.EvaluationLineMappingPermissionDeniedException = EvaluationLineMappingPermissionDeniedException;
class EvaluationLineMappingSelfEvaluationException extends EvaluationLineMappingDomainException {
    constructor(employeeId) {
        super(`평가 라인에서 자기 자신을 평가할 수 없습니다: 직원 ${employeeId}`, 'EVALUATION_LINE_MAPPING_SELF_EVALUATION', 400, { employeeId });
        this.name = 'EvaluationLineMappingSelfEvaluationException';
    }
}
exports.EvaluationLineMappingSelfEvaluationException = EvaluationLineMappingSelfEvaluationException;
class EvaluationLineMappingProjectMismatchException extends EvaluationLineMappingDomainException {
    constructor(mappingId, mappingProjectId, lineProjectId) {
        super(`평가 라인 맵핑의 프로젝트와 평가 라인의 프로젝트가 일치하지 않습니다: 맵핑 ${mappingId}, 맵핑 프로젝트 ${mappingProjectId}, 라인 프로젝트 ${lineProjectId}`, 'EVALUATION_LINE_MAPPING_PROJECT_MISMATCH', 400, { mappingId, mappingProjectId, lineProjectId });
        this.name = 'EvaluationLineMappingProjectMismatchException';
    }
}
exports.EvaluationLineMappingProjectMismatchException = EvaluationLineMappingProjectMismatchException;
class EvaluationLineMappingBusinessRuleViolationException extends EvaluationLineMappingDomainException {
    constructor(message, context) {
        super(message, 'EVALUATION_LINE_MAPPING_BUSINESS_RULE_VIOLATION', 422, context);
        this.name = 'EvaluationLineMappingBusinessRuleViolationException';
    }
}
exports.EvaluationLineMappingBusinessRuleViolationException = EvaluationLineMappingBusinessRuleViolationException;
class EvaluationLineMappingDuplicateException extends EvaluationLineMappingDomainException {
    constructor(message, context) {
        super(message, 'EVALUATION_LINE_MAPPING_DUPLICATE', 409, context);
        this.name = 'EvaluationLineMappingDuplicateException';
    }
}
exports.EvaluationLineMappingDuplicateException = EvaluationLineMappingDuplicateException;
class EvaluationLineMappingRequiredDataMissingException extends EvaluationLineMappingDomainException {
    constructor(message, context) {
        super(message, 'EVALUATION_LINE_MAPPING_REQUIRED_DATA_MISSING', 400, context);
        this.name = 'EvaluationLineMappingRequiredDataMissingException';
    }
}
exports.EvaluationLineMappingRequiredDataMissingException = EvaluationLineMappingRequiredDataMissingException;
class InvalidEvaluationLineMappingDataFormatException extends EvaluationLineMappingDomainException {
    constructor(message, context) {
        super(message, 'INVALID_EVALUATION_LINE_MAPPING_DATA_FORMAT', 400, context);
        this.name = 'InvalidEvaluationLineMappingDataFormatException';
    }
}
exports.InvalidEvaluationLineMappingDataFormatException = InvalidEvaluationLineMappingDataFormatException;
//# sourceMappingURL=evaluation-line-mapping.exceptions.js.map