"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcludedEvaluationTargetAccessException = exports.NotExcludedEvaluationTargetException = exports.AlreadyExcludedEvaluationTargetException = exports.EvaluationTargetExclusionException = exports.EvaluationPeriodEmployeeMappingValidationException = exports.EvaluationPeriodEmployeeMappingDuplicateException = exports.EvaluationPeriodEmployeeMappingNotFoundException = exports.EvaluationPeriodEmployeeMappingDomainException = void 0;
class EvaluationPeriodEmployeeMappingDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'EvaluationPeriodEmployeeMappingDomainException';
    }
}
exports.EvaluationPeriodEmployeeMappingDomainException = EvaluationPeriodEmployeeMappingDomainException;
class EvaluationPeriodEmployeeMappingNotFoundException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(identifier) {
        super(`평가기간-직원 맵핑을 찾을 수 없습니다: ${identifier}`, 'EVALUATION_PERIOD_EMPLOYEE_MAPPING_NOT_FOUND', 404, { identifier });
        this.name = 'EvaluationPeriodEmployeeMappingNotFoundException';
    }
}
exports.EvaluationPeriodEmployeeMappingNotFoundException = EvaluationPeriodEmployeeMappingNotFoundException;
class EvaluationPeriodEmployeeMappingDuplicateException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(evaluationPeriodId, employeeId) {
        super(`이미 존재하는 평가기간-직원 맵핑입니다: 평가기간 ${evaluationPeriodId}, 직원 ${employeeId}`, 'EVALUATION_PERIOD_EMPLOYEE_MAPPING_DUPLICATE', 409, { evaluationPeriodId, employeeId });
        this.name = 'EvaluationPeriodEmployeeMappingDuplicateException';
    }
}
exports.EvaluationPeriodEmployeeMappingDuplicateException = EvaluationPeriodEmployeeMappingDuplicateException;
class EvaluationPeriodEmployeeMappingValidationException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(message) {
        super(`평가기간-직원 맵핑 유효성 검사 실패: ${message}`, 'EVALUATION_PERIOD_EMPLOYEE_MAPPING_VALIDATION_ERROR', 400, { message });
        this.name = 'EvaluationPeriodEmployeeMappingValidationException';
    }
}
exports.EvaluationPeriodEmployeeMappingValidationException = EvaluationPeriodEmployeeMappingValidationException;
class EvaluationTargetExclusionException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(evaluationPeriodId, employeeId, reason) {
        super(`평가 대상 제외 처리 실패: 평가기간 ${evaluationPeriodId}, 직원 ${employeeId}, 사유: ${reason}`, 'EVALUATION_TARGET_EXCLUSION_ERROR', 400, { evaluationPeriodId, employeeId, reason });
        this.name = 'EvaluationTargetExclusionException';
    }
}
exports.EvaluationTargetExclusionException = EvaluationTargetExclusionException;
class AlreadyExcludedEvaluationTargetException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(evaluationPeriodId, employeeId) {
        super(`이미 평가 대상에서 제외된 직원입니다: 평가기간 ${evaluationPeriodId}, 직원 ${employeeId}`, 'ALREADY_EXCLUDED_EVALUATION_TARGET', 409, { evaluationPeriodId, employeeId });
        this.name = 'AlreadyExcludedEvaluationTargetException';
    }
}
exports.AlreadyExcludedEvaluationTargetException = AlreadyExcludedEvaluationTargetException;
class NotExcludedEvaluationTargetException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(evaluationPeriodId, employeeId) {
        super(`평가 대상에서 제외되지 않은 직원입니다: 평가기간 ${evaluationPeriodId}, 직원 ${employeeId}`, 'NOT_EXCLUDED_EVALUATION_TARGET', 409, { evaluationPeriodId, employeeId });
        this.name = 'NotExcludedEvaluationTargetException';
    }
}
exports.NotExcludedEvaluationTargetException = NotExcludedEvaluationTargetException;
class ExcludedEvaluationTargetAccessException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(evaluationPeriodId, employeeId) {
        super(`평가 대상에서 제외된 직원은 할당 정보를 조회할 수 없습니다: 평가기간 ${evaluationPeriodId}, 직원 ${employeeId}`, 'EXCLUDED_EVALUATION_TARGET_ACCESS_DENIED', 400, { evaluationPeriodId, employeeId });
        this.name = 'ExcludedEvaluationTargetAccessException';
    }
}
exports.ExcludedEvaluationTargetAccessException = ExcludedEvaluationTargetAccessException;
//# sourceMappingURL=evaluation-period-employee-mapping.exceptions.js.map