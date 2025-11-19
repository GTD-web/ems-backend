import { NotFoundException, BadRequestException } from '@nestjs/common';
export declare class SecondaryEvaluationStepApprovalNotFoundException extends NotFoundException {
    constructor(id: string);
}
export declare class SecondaryStepApprovalNotFoundByMappingAndEvaluatorException extends NotFoundException {
    constructor(mappingId: string, evaluatorId: string);
}
export declare class InvalidSecondaryStatusTransitionException extends BadRequestException {
    constructor(currentStatus: string, targetStatus: string, reason?: string);
}
