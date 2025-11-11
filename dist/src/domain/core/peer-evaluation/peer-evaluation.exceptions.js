"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerEvaluationPeriodExpiredException = exports.PeerEvaluationPermissionDeniedException = exports.PeerEvaluationDuplicateException = exports.PeerEvaluationValidationException = exports.SelfPeerEvaluationException = exports.PeerEvaluationNotFoundException = exports.DuplicatePeerEvaluationException = exports.InvalidPeerEvaluationScoreException = exports.PeerEvaluationDomainException = void 0;
class PeerEvaluationDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'PeerEvaluationDomainException';
    }
}
exports.PeerEvaluationDomainException = PeerEvaluationDomainException;
class InvalidPeerEvaluationScoreException extends PeerEvaluationDomainException {
    constructor(score, minScore, maxScore, evaluationId) {
        super(`동료 평가 점수가 유효 범위를 벗어났습니다: ${score} (범위: ${minScore}-${maxScore})`, 'INVALID_PEER_EVALUATION_SCORE', 400, { score, minScore, maxScore, evaluationId });
        this.name = 'InvalidPeerEvaluationScoreException';
    }
}
exports.InvalidPeerEvaluationScoreException = InvalidPeerEvaluationScoreException;
class DuplicatePeerEvaluationException extends PeerEvaluationDomainException {
    constructor(evaluateeId, evaluatorId, periodId) {
        super(`이미 존재하는 동료 평가입니다: 피평가자 ${evaluateeId}, 평가자 ${evaluatorId}, 평가기간 ${periodId}`, 'DUPLICATE_PEER_EVALUATION', 409, { evaluateeId, evaluatorId, periodId });
        this.name = 'DuplicatePeerEvaluationException';
    }
}
exports.DuplicatePeerEvaluationException = DuplicatePeerEvaluationException;
class PeerEvaluationNotFoundException extends PeerEvaluationDomainException {
    constructor(identifier) {
        super(`동료 평가를 찾을 수 없습니다: ${identifier}`, 'PEER_EVALUATION_NOT_FOUND', 404, { identifier });
        this.name = 'PeerEvaluationNotFoundException';
    }
}
exports.PeerEvaluationNotFoundException = PeerEvaluationNotFoundException;
class SelfPeerEvaluationException extends PeerEvaluationDomainException {
    constructor(evaluateeId) {
        super(`자기 자신을 동료 평가할 수 없습니다: ${evaluateeId}`, 'SELF_PEER_EVALUATION', 400, { evaluateeId });
        this.name = 'SelfPeerEvaluationException';
    }
}
exports.SelfPeerEvaluationException = SelfPeerEvaluationException;
class PeerEvaluationValidationException extends PeerEvaluationDomainException {
    constructor(message) {
        super(`동료평가 유효성 검사 실패: ${message}`, 'PEER_EVALUATION_VALIDATION_ERROR', 400, { message });
        this.name = 'PeerEvaluationValidationException';
    }
}
exports.PeerEvaluationValidationException = PeerEvaluationValidationException;
class PeerEvaluationDuplicateException extends PeerEvaluationDomainException {
    constructor(evaluatorId, evaluateeId, periodId) {
        super(`이미 존재하는 동료평가입니다: 평가자 ${evaluatorId}, 피평가자 ${evaluateeId}, 기간 ${periodId}`, 'PEER_EVALUATION_DUPLICATE', 409, { evaluatorId, evaluateeId, periodId });
        this.name = 'PeerEvaluationDuplicateException';
    }
}
exports.PeerEvaluationDuplicateException = PeerEvaluationDuplicateException;
class PeerEvaluationPermissionDeniedException extends PeerEvaluationDomainException {
    constructor(userId, action) {
        super(`동료평가에 대한 ${action} 권한이 없습니다: 사용자 ${userId}`, 'PEER_EVALUATION_PERMISSION_DENIED', 403, { userId, action });
        this.name = 'PeerEvaluationPermissionDeniedException';
    }
}
exports.PeerEvaluationPermissionDeniedException = PeerEvaluationPermissionDeniedException;
class PeerEvaluationPeriodExpiredException extends PeerEvaluationDomainException {
    constructor(evaluationId, periodId) {
        super(`동료평가의 평가 기간이 만료되었습니다: 평가 ${evaluationId}, 기간 ${periodId}`, 'PEER_EVALUATION_PERIOD_EXPIRED', 400, { evaluationId, periodId });
        this.name = 'PeerEvaluationPeriodExpiredException';
    }
}
exports.PeerEvaluationPeriodExpiredException = PeerEvaluationPeriodExpiredException;
//# sourceMappingURL=peer-evaluation.exceptions.js.map