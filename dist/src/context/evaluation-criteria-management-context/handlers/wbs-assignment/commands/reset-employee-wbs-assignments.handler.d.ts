import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
export declare class ResetEmployeeWbsAssignmentsCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly resetBy: string;
    constructor(employeeId: string, periodId: string, resetBy: string);
}
export declare class ResetEmployeeWbsAssignmentsHandler implements ICommandHandler<ResetEmployeeWbsAssignmentsCommand> {
    private readonly wbsAssignmentService;
    constructor(wbsAssignmentService: EvaluationWbsAssignmentService);
    execute(command: ResetEmployeeWbsAssignmentsCommand): Promise<void>;
}
