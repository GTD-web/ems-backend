import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
export declare class ResetProjectWbsAssignmentsCommand {
    readonly projectId: string;
    readonly periodId: string;
    readonly resetBy: string;
    constructor(projectId: string, periodId: string, resetBy: string);
}
export declare class ResetProjectWbsAssignmentsHandler implements ICommandHandler<ResetProjectWbsAssignmentsCommand> {
    private readonly wbsAssignmentService;
    constructor(wbsAssignmentService: EvaluationWbsAssignmentService);
    execute(command: ResetProjectWbsAssignmentsCommand): Promise<void>;
}
