import { NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
export declare class EvaluationRevisionRequestNotFoundException extends NotFoundException {
    constructor(id: string);
}
export declare class RevisionRequestRecipientNotFoundException extends NotFoundException {
    constructor(recipientId: string, requestId: string);
}
export declare class UnauthorizedRevisionRequestAccessException extends ForbiddenException {
    constructor(recipientId: string, requestId: string);
}
export declare class RevisionRequestAlreadyCompletedException extends ConflictException {
    constructor(requestId: string);
}
export declare class EmptyResponseCommentException extends BadRequestException {
    constructor();
}
export declare class InvalidRecipientTypeException extends BadRequestException {
    constructor(type: string);
}
