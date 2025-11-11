import { NotFoundException, BadRequestException } from '@nestjs/common';
export declare class EmployeeEvaluationStepApprovalNotFoundException extends NotFoundException {
    constructor(id: string);
}
export declare class StepApprovalNotFoundByMappingException extends NotFoundException {
    constructor(mappingId: string);
}
export declare class InvalidStepTypeException extends BadRequestException {
    constructor(step: string);
}
export declare class InvalidStatusTransitionException extends BadRequestException {
    constructor(step: string, currentStatus: string, targetStatus: string, reason?: string);
}
