"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliverableMappingPermissionDeniedException = exports.DeliverableMappingDuplicateException = exports.DeliverableDuplicateException = exports.DeliverableValidationException = exports.DeliverableFileSizeExceededException = exports.DeliverableAccessDeniedException = exports.DuplicateDeliverableException = exports.DeliverableNotFoundException = exports.DeliverableTypeMismatchException = exports.InvalidDeliverablePathException = exports.DeliverableDomainException = void 0;
class DeliverableDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'DeliverableDomainException';
    }
}
exports.DeliverableDomainException = DeliverableDomainException;
class InvalidDeliverablePathException extends DeliverableDomainException {
    constructor(path, type, deliverableId) {
        super(`잘못된 산출물 경로입니다: ${path} (타입: ${type})`, 'INVALID_DELIVERABLE_PATH', 400, { path, type, deliverableId });
        this.name = 'InvalidDeliverablePathException';
    }
}
exports.InvalidDeliverablePathException = InvalidDeliverablePathException;
class DeliverableTypeMismatchException extends DeliverableDomainException {
    constructor(expectedType, actualType, deliverableId) {
        super(`산출물 타입이 일치하지 않습니다: 예상 ${expectedType}, 실제 ${actualType}`, 'DELIVERABLE_TYPE_MISMATCH', 400, { expectedType, actualType, deliverableId });
        this.name = 'DeliverableTypeMismatchException';
    }
}
exports.DeliverableTypeMismatchException = DeliverableTypeMismatchException;
class DeliverableNotFoundException extends DeliverableDomainException {
    constructor(identifier) {
        super(`산출물을 찾을 수 없습니다: ${identifier}`, 'DELIVERABLE_NOT_FOUND', 404, { identifier });
        this.name = 'DeliverableNotFoundException';
    }
}
exports.DeliverableNotFoundException = DeliverableNotFoundException;
class DuplicateDeliverableException extends DeliverableDomainException {
    constructor(wbsItemId, title) {
        super(`이미 존재하는 산출물입니다: WBS ${wbsItemId}, 제목 ${title}`, 'DUPLICATE_DELIVERABLE', 409, { wbsItemId, title });
        this.name = 'DuplicateDeliverableException';
    }
}
exports.DuplicateDeliverableException = DuplicateDeliverableException;
class DeliverableAccessDeniedException extends DeliverableDomainException {
    constructor(deliverableId, employeeId) {
        super(`산출물 접근 권한이 없습니다: ${deliverableId} (직원: ${employeeId})`, 'DELIVERABLE_ACCESS_DENIED', 403, { deliverableId, employeeId });
        this.name = 'DeliverableAccessDeniedException';
    }
}
exports.DeliverableAccessDeniedException = DeliverableAccessDeniedException;
class DeliverableFileSizeExceededException extends DeliverableDomainException {
    constructor(fileSize, maxSize, deliverableId) {
        super(`산출물 파일 크기가 제한을 초과했습니다: ${fileSize}MB (최대: ${maxSize}MB)`, 'DELIVERABLE_FILE_SIZE_EXCEEDED', 400, { fileSize, maxSize, deliverableId });
        this.name = 'DeliverableFileSizeExceededException';
    }
}
exports.DeliverableFileSizeExceededException = DeliverableFileSizeExceededException;
class DeliverableValidationException extends DeliverableDomainException {
    constructor(message) {
        super(`산출물 유효성 검사 실패: ${message}`, 'DELIVERABLE_VALIDATION_ERROR', 400, { message });
        this.name = 'DeliverableValidationException';
    }
}
exports.DeliverableValidationException = DeliverableValidationException;
class DeliverableDuplicateException extends DeliverableDomainException {
    constructor(name) {
        super(`이미 존재하는 산출물입니다: 이름 ${name}`, 'DELIVERABLE_DUPLICATE', 409, { name });
        this.name = 'DeliverableDuplicateException';
    }
}
exports.DeliverableDuplicateException = DeliverableDuplicateException;
class DeliverableMappingDuplicateException extends DeliverableDomainException {
    constructor(employeeId, wbsItemId, deliverableId) {
        super(`이미 존재하는 산출물 매핑입니다: 직원 ${employeeId}, WBS ${wbsItemId}, 산출물 ${deliverableId}`, 'DELIVERABLE_MAPPING_DUPLICATE', 409, { employeeId, wbsItemId, deliverableId });
        this.name = 'DeliverableMappingDuplicateException';
    }
}
exports.DeliverableMappingDuplicateException = DeliverableMappingDuplicateException;
class DeliverableMappingPermissionDeniedException extends DeliverableDomainException {
    constructor(deliverableId, employeeId, requesterId) {
        super(`산출물 매핑 권한이 없습니다. 본인의 산출물만 관리할 수 있습니다: 산출물 ${deliverableId}, 소유자 ${employeeId}, 요청자 ${requesterId}`, 'DELIVERABLE_MAPPING_PERMISSION_DENIED', 403, { deliverableId, employeeId, requesterId });
        this.name = 'DeliverableMappingPermissionDeniedException';
    }
}
exports.DeliverableMappingPermissionDeniedException = DeliverableMappingPermissionDeniedException;
//# sourceMappingURL=deliverable.exceptions.js.map