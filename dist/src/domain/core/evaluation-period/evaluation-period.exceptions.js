"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveEvaluationPeriodAlreadyExistsException = exports.EvaluationPeriodDateOverlapException = exports.DuplicateEvaluationPeriodNameException = exports.SelfEvaluationRateSettingNotAllowedException = exports.InvalidSelfEvaluationRateException = exports.EvaluationPeriodExternalServiceException = exports.EvaluationPeriodModificationNotAllowedException = exports.EvaluationPeriodDeletionNotAllowedException = exports.InsufficientEvaluationPeriodPermissionException = exports.EvaluationPeriodServiceException = exports.NoActiveEvaluationPeriodException = exports.EvaluationPeriodNotFoundException = exports.EvaluationPeriodOverlapException = exports.EvaluationPeriodNameDuplicateException = exports.DuplicateEvaluationPeriodException = exports.EvaluationPeriodRepositoryException = exports.MultipleActiveEvaluationPeriodsException = exports.EvaluationPeriodNotStartedException = exports.EvaluationPeriodExpiredException = exports.InvalidEvaluationPeriodDetailScheduleException = exports.InvalidEvaluationPeriodDateRangeException = exports.InvalidEvaluationPeriodDataFormatException = exports.EvaluationPeriodRequiredDataMissingException = exports.EvaluationPeriodBusinessRuleViolationException = exports.InvalidEvaluationPeriodPhaseTransitionException = exports.InvalidEvaluationPeriodStatusTransitionException = exports.EvaluationPeriodDomainException = void 0;
const date_time_utils_1 = require("./utils/date-time.utils");
class EvaluationPeriodDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'EvaluationPeriodDomainException';
    }
}
exports.EvaluationPeriodDomainException = EvaluationPeriodDomainException;
class InvalidEvaluationPeriodStatusTransitionException extends EvaluationPeriodDomainException {
    constructor(currentStatus, targetStatus, message, periodId) {
        super(message ||
            `평가 기간 상태 전이가 불가능합니다: ${currentStatus} → ${targetStatus}`, 'INVALID_EVALUATION_PERIOD_STATUS_TRANSITION', 422, { currentStatus, targetStatus, periodId });
        this.name = 'InvalidEvaluationPeriodStatusTransitionException';
    }
}
exports.InvalidEvaluationPeriodStatusTransitionException = InvalidEvaluationPeriodStatusTransitionException;
class InvalidEvaluationPeriodPhaseTransitionException extends EvaluationPeriodDomainException {
    constructor(currentPhase, targetPhase, periodId) {
        super(`평가 기간 단계 전이가 불가능합니다: ${currentPhase} → ${targetPhase}`, 'INVALID_EVALUATION_PERIOD_PHASE_TRANSITION', 422, { currentPhase, targetPhase, periodId });
        this.name = 'InvalidEvaluationPeriodPhaseTransitionException';
    }
}
exports.InvalidEvaluationPeriodPhaseTransitionException = InvalidEvaluationPeriodPhaseTransitionException;
class EvaluationPeriodBusinessRuleViolationException extends EvaluationPeriodDomainException {
    constructor(rule, context) {
        super(`평가 기간 비즈니스 규칙 위반: ${rule}`, 'EVALUATION_PERIOD_BUSINESS_RULE_VIOLATION', 422, context);
        this.name = 'EvaluationPeriodBusinessRuleViolationException';
    }
}
exports.EvaluationPeriodBusinessRuleViolationException = EvaluationPeriodBusinessRuleViolationException;
class EvaluationPeriodRequiredDataMissingException extends EvaluationPeriodDomainException {
    constructor(fieldName, context) {
        super(`평가 기간 필수 데이터가 누락되었습니다: ${fieldName}`, 'EVALUATION_PERIOD_REQUIRED_DATA_MISSING', 400, context);
        this.name = 'EvaluationPeriodRequiredDataMissingException';
    }
}
exports.EvaluationPeriodRequiredDataMissingException = EvaluationPeriodRequiredDataMissingException;
class InvalidEvaluationPeriodDataFormatException extends EvaluationPeriodDomainException {
    constructor(fieldName, expectedFormat, actualValue) {
        super(`평가 기간 데이터 형식이 올바르지 않습니다: ${fieldName} (예상: ${expectedFormat})`, 'INVALID_EVALUATION_PERIOD_DATA_FORMAT', 400, { fieldName, expectedFormat, actualValue });
        this.name = 'InvalidEvaluationPeriodDataFormatException';
    }
}
exports.InvalidEvaluationPeriodDataFormatException = InvalidEvaluationPeriodDataFormatException;
class InvalidEvaluationPeriodDateRangeException extends EvaluationPeriodDomainException {
    constructor(message, startDate, endDate, periodId) {
        super(message, 'INVALID_EVALUATION_PERIOD_DATE_RANGE', 400, {
            startDate,
            endDate,
            periodId,
        });
        this.name = 'InvalidEvaluationPeriodDateRangeException';
    }
}
exports.InvalidEvaluationPeriodDateRangeException = InvalidEvaluationPeriodDateRangeException;
class InvalidEvaluationPeriodDetailScheduleException extends EvaluationPeriodDomainException {
    constructor(scheduleType, startDate, endDate, periodId) {
        super(`${scheduleType} 일정이 평가 기간을 벗어났습니다: ${startDate} - ${endDate}`, 'INVALID_EVALUATION_PERIOD_DETAIL_SCHEDULE', 400, { scheduleType, startDate, endDate, periodId });
        this.name = 'InvalidEvaluationPeriodDetailScheduleException';
    }
}
exports.InvalidEvaluationPeriodDetailScheduleException = InvalidEvaluationPeriodDetailScheduleException;
class EvaluationPeriodExpiredException extends EvaluationPeriodDomainException {
    constructor(periodId, endDate) {
        super(`만료된 평가 기간입니다: ${periodId} (종료일: ${endDate})`, 'EVALUATION_PERIOD_EXPIRED', 422, { periodId, endDate });
        this.name = 'EvaluationPeriodExpiredException';
    }
}
exports.EvaluationPeriodExpiredException = EvaluationPeriodExpiredException;
class EvaluationPeriodNotStartedException extends EvaluationPeriodDomainException {
    constructor(periodId, startDate) {
        super(`아직 시작되지 않은 평가 기간입니다: ${periodId} (시작일: ${startDate})`, 'EVALUATION_PERIOD_NOT_STARTED', 422, { periodId, startDate });
        this.name = 'EvaluationPeriodNotStartedException';
    }
}
exports.EvaluationPeriodNotStartedException = EvaluationPeriodNotStartedException;
class MultipleActiveEvaluationPeriodsException extends EvaluationPeriodDomainException {
    constructor(activePeriodIds) {
        super(`동시에 여러 평가 기간이 활성화될 수 없습니다: ${activePeriodIds.join(', ')}`, 'MULTIPLE_ACTIVE_EVALUATION_PERIODS', 422, { activePeriodIds });
        this.name = 'MultipleActiveEvaluationPeriodsException';
    }
}
exports.MultipleActiveEvaluationPeriodsException = MultipleActiveEvaluationPeriodsException;
class EvaluationPeriodRepositoryException extends Error {
    statusCode;
    originalError;
    operation;
    constructor(message, statusCode = 500, originalError, operation) {
        super(message);
        this.statusCode = statusCode;
        this.originalError = originalError;
        this.operation = operation;
        this.name = 'EvaluationPeriodRepositoryException';
    }
}
exports.EvaluationPeriodRepositoryException = EvaluationPeriodRepositoryException;
class DuplicateEvaluationPeriodException extends EvaluationPeriodRepositoryException {
    constructor(identifier, originalError) {
        super(`이미 존재하는 평가 기간입니다: ${identifier}`, 409, originalError, 'CREATE');
        this.name = 'DuplicateEvaluationPeriodException';
    }
}
exports.DuplicateEvaluationPeriodException = DuplicateEvaluationPeriodException;
class EvaluationPeriodNameDuplicateException extends EvaluationPeriodRepositoryException {
    constructor(name, originalError) {
        super(`이미 존재하는 평가 기간 이름입니다: ${name}`, 409, originalError, 'NAME_DUPLICATE_CHECK');
        this.name = 'EvaluationPeriodNameDuplicateException';
    }
}
exports.EvaluationPeriodNameDuplicateException = EvaluationPeriodNameDuplicateException;
class EvaluationPeriodOverlapException extends EvaluationPeriodRepositoryException {
    constructor(startDate, endDate, conflictingPeriodId, originalError) {
        const formattedStartDate = date_time_utils_1.DateTimeUtils.날짜문자열변환한다(startDate);
        const formattedEndDate = date_time_utils_1.DateTimeUtils.날짜문자열변환한다(endDate);
        super(`평가 기간이 기존 기간과 겹칩니다: ${formattedStartDate} ~ ${formattedEndDate} (충돌 기간 ID: ${conflictingPeriodId})`, 409, originalError, 'PERIOD_OVERLAP_CHECK');
        this.name = 'EvaluationPeriodOverlapException';
    }
}
exports.EvaluationPeriodOverlapException = EvaluationPeriodOverlapException;
class EvaluationPeriodNotFoundException extends EvaluationPeriodRepositoryException {
    constructor(identifier, originalError) {
        super(`평가 기간을 찾을 수 없습니다: ${identifier}`, 404, originalError, 'FIND');
        this.name = 'EvaluationPeriodNotFoundException';
    }
}
exports.EvaluationPeriodNotFoundException = EvaluationPeriodNotFoundException;
class NoActiveEvaluationPeriodException extends EvaluationPeriodRepositoryException {
    constructor(originalError) {
        super('현재 활성화된 평가 기간이 없습니다', 404, originalError, 'FIND_ACTIVE');
        this.name = 'NoActiveEvaluationPeriodException';
    }
}
exports.NoActiveEvaluationPeriodException = NoActiveEvaluationPeriodException;
class EvaluationPeriodServiceException extends Error {
    code;
    statusCode;
    originalError;
    constructor(message, code, statusCode = 500, originalError) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.originalError = originalError;
        this.name = 'EvaluationPeriodServiceException';
    }
}
exports.EvaluationPeriodServiceException = EvaluationPeriodServiceException;
class InsufficientEvaluationPeriodPermissionException extends EvaluationPeriodServiceException {
    constructor(action, userId, periodId) {
        super(`평가 기간 권한이 부족합니다: ${action}`, 'INSUFFICIENT_EVALUATION_PERIOD_PERMISSION', 403);
        this.name = 'InsufficientEvaluationPeriodPermissionException';
    }
}
exports.InsufficientEvaluationPeriodPermissionException = InsufficientEvaluationPeriodPermissionException;
class EvaluationPeriodDeletionNotAllowedException extends EvaluationPeriodServiceException {
    constructor(periodId, reason) {
        super(`평가 기간을 삭제할 수 없습니다: ${reason}`, 'EVALUATION_PERIOD_DELETION_NOT_ALLOWED', 422);
        this.name = 'EvaluationPeriodDeletionNotAllowedException';
    }
}
exports.EvaluationPeriodDeletionNotAllowedException = EvaluationPeriodDeletionNotAllowedException;
class EvaluationPeriodModificationNotAllowedException extends EvaluationPeriodServiceException {
    constructor(periodId, reason) {
        super(`평가 기간을 수정할 수 없습니다: ${reason}`, 'EVALUATION_PERIOD_MODIFICATION_NOT_ALLOWED', 422);
        this.name = 'EvaluationPeriodModificationNotAllowedException';
    }
}
exports.EvaluationPeriodModificationNotAllowedException = EvaluationPeriodModificationNotAllowedException;
class EvaluationPeriodExternalServiceException extends EvaluationPeriodServiceException {
    constructor(serviceName, operation, originalError) {
        super(`평가 기간 외부 서비스 연동 실패: ${serviceName}.${operation}`, 'EVALUATION_PERIOD_EXTERNAL_SERVICE_ERROR', 502, originalError);
        this.name = 'EvaluationPeriodExternalServiceException';
    }
}
exports.EvaluationPeriodExternalServiceException = EvaluationPeriodExternalServiceException;
class InvalidSelfEvaluationRateException extends EvaluationPeriodDomainException {
    constructor(rate, minRate = 0, maxRate = 200) {
        super(`유효하지 않은 자기평가 달성률입니다: ${rate}% (허용 범위: ${minRate}% ~ ${maxRate}%)`, 'INVALID_SELF_EVALUATION_RATE', 400, { rate, minRate, maxRate });
        this.name = 'InvalidSelfEvaluationRateException';
    }
}
exports.InvalidSelfEvaluationRateException = InvalidSelfEvaluationRateException;
class SelfEvaluationRateSettingNotAllowedException extends EvaluationPeriodDomainException {
    constructor(periodId, currentStatus, reason) {
        super(`자기평가 달성률을 설정할 수 없습니다: ${reason} (현재 상태: ${currentStatus})`, 'SELF_EVALUATION_RATE_SETTING_NOT_ALLOWED', 422, { periodId, currentStatus, reason });
        this.name = 'SelfEvaluationRateSettingNotAllowedException';
    }
}
exports.SelfEvaluationRateSettingNotAllowedException = SelfEvaluationRateSettingNotAllowedException;
class DuplicateEvaluationPeriodNameException extends EvaluationPeriodRepositoryException {
    constructor(name, originalError) {
        super(`이미 존재하는 평가 기간 이름입니다: ${name}`, 409, originalError, 'NAME_DUPLICATE_CHECK');
        this.name = 'DuplicateEvaluationPeriodNameException';
    }
}
exports.DuplicateEvaluationPeriodNameException = DuplicateEvaluationPeriodNameException;
class EvaluationPeriodDateOverlapException extends EvaluationPeriodRepositoryException {
    constructor(startDate, endDate, originalError) {
        const formattedStartDate = date_time_utils_1.DateTimeUtils.날짜문자열변환한다(startDate);
        const formattedEndDate = date_time_utils_1.DateTimeUtils.날짜문자열변환한다(endDate);
        super(`평가 기간이 기존 기간과 겹칩니다: ${formattedStartDate} ~ ${formattedEndDate}`, 409, originalError, 'PERIOD_OVERLAP_CHECK');
        this.name = 'EvaluationPeriodDateOverlapException';
    }
}
exports.EvaluationPeriodDateOverlapException = EvaluationPeriodDateOverlapException;
class ActiveEvaluationPeriodAlreadyExistsException extends EvaluationPeriodServiceException {
    constructor(activePeriodName) {
        super(`이미 활성화된 평가 기간이 있습니다: ${activePeriodName}`, 'ACTIVE_EVALUATION_PERIOD_ALREADY_EXISTS', 422);
        this.name = 'ActiveEvaluationPeriodAlreadyExistsException';
    }
}
exports.ActiveEvaluationPeriodAlreadyExistsException = ActiveEvaluationPeriodAlreadyExistsException;
//# sourceMappingURL=evaluation-period.exceptions.js.map