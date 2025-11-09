import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
export declare class PeerEvaluationQuestionMappingDomainException extends BadRequestException {
    constructor(message: string, code: string, statusCode?: number, data?: any);
}
export declare class PeerEvaluationQuestionMappingNotFoundException extends NotFoundException {
    constructor(mappingId: string);
}
export declare class DuplicatePeerEvaluationQuestionMappingException extends ConflictException {
    constructor(peerEvaluationId: string, questionId: string);
}
