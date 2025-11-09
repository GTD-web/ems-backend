export declare class DeliverableDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class InvalidDeliverablePathException extends DeliverableDomainException {
    constructor(path: string, type: string, deliverableId?: string);
}
export declare class DeliverableTypeMismatchException extends DeliverableDomainException {
    constructor(expectedType: string, actualType: string, deliverableId?: string);
}
export declare class DeliverableNotFoundException extends DeliverableDomainException {
    constructor(identifier: string);
}
export declare class DuplicateDeliverableException extends DeliverableDomainException {
    constructor(wbsItemId: string, title: string);
}
export declare class DeliverableAccessDeniedException extends DeliverableDomainException {
    constructor(deliverableId: string, employeeId: string);
}
export declare class DeliverableFileSizeExceededException extends DeliverableDomainException {
    constructor(fileSize: number, maxSize: number, deliverableId?: string);
}
export declare class DeliverableValidationException extends DeliverableDomainException {
    constructor(message: string);
}
export declare class DeliverableDuplicateException extends DeliverableDomainException {
    constructor(name: string);
}
export declare class DeliverableMappingDuplicateException extends DeliverableDomainException {
    constructor(employeeId: string, wbsItemId: string, deliverableId: string);
}
export declare class DeliverableMappingPermissionDeniedException extends DeliverableDomainException {
    constructor(deliverableId: string, employeeId: string, requesterId: string);
}
