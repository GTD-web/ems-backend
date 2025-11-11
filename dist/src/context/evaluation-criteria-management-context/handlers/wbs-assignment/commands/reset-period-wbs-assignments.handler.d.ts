import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
export declare class ResetPeriodWbsAssignmentsCommand {
    readonly periodId: string;
    readonly resetBy: string;
    constructor(periodId: string, resetBy: string);
}
export declare class ResetPeriodWbsAssignmentsHandler implements ICommandHandler<ResetPeriodWbsAssignmentsCommand> {
    private readonly wbsAssignmentService;
    constructor(wbsAssignmentService: EvaluationWbsAssignmentService);
    execute(command: ResetPeriodWbsAssignmentsCommand): Promise<void>;
}
