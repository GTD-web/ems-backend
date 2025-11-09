"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidRecipientTypeException = exports.EmptyResponseCommentException = exports.RevisionRequestAlreadyCompletedException = exports.UnauthorizedRevisionRequestAccessException = exports.RevisionRequestRecipientNotFoundException = exports.EvaluationRevisionRequestNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class EvaluationRevisionRequestNotFoundException extends common_1.NotFoundException {
    constructor(id) {
        super(`재작성 요청을 찾을 수 없습니다. (ID: ${id})`);
    }
}
exports.EvaluationRevisionRequestNotFoundException = EvaluationRevisionRequestNotFoundException;
class RevisionRequestRecipientNotFoundException extends common_1.NotFoundException {
    constructor(recipientId, requestId) {
        super(`재작성 요청 수신자를 찾을 수 없습니다. (수신자 ID: ${recipientId}, 요청 ID: ${requestId})`);
    }
}
exports.RevisionRequestRecipientNotFoundException = RevisionRequestRecipientNotFoundException;
class UnauthorizedRevisionRequestAccessException extends common_1.ForbiddenException {
    constructor(recipientId, requestId) {
        super(`해당 재작성 요청에 접근할 권한이 없습니다. (수신자 ID: ${recipientId}, 요청 ID: ${requestId})`);
    }
}
exports.UnauthorizedRevisionRequestAccessException = UnauthorizedRevisionRequestAccessException;
class RevisionRequestAlreadyCompletedException extends common_1.ConflictException {
    constructor(requestId) {
        super(`이미 완료된 재작성 요청입니다. (요청 ID: ${requestId})`);
    }
}
exports.RevisionRequestAlreadyCompletedException = RevisionRequestAlreadyCompletedException;
class EmptyResponseCommentException extends common_1.BadRequestException {
    constructor() {
        super('재작성 완료 응답 코멘트는 필수입니다.');
    }
}
exports.EmptyResponseCommentException = EmptyResponseCommentException;
class InvalidRecipientTypeException extends common_1.BadRequestException {
    constructor(type) {
        super(`유효하지 않은 수신자 타입입니다: ${type}`);
    }
}
exports.InvalidRecipientTypeException = InvalidRecipientTypeException;
//# sourceMappingURL=evaluation-revision-request.exceptions.js.map