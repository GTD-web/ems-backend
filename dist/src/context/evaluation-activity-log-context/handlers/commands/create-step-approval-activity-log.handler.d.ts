import { ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';
import type { EvaluationActivityLogDto } from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';
export declare class 단계승인활동내역을생성한다 {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    readonly step: string;
    readonly status: StepApprovalStatus;
    readonly updatedBy: string;
    readonly revisionComment?: string | undefined;
    readonly evaluatorId?: string | undefined;
    constructor(evaluationPeriodId: string, employeeId: string, step: string, status: StepApprovalStatus, updatedBy: string, revisionComment?: string | undefined, evaluatorId?: string | undefined);
}
export declare class CreateStepApprovalActivityLogHandler implements ICommandHandler<단계승인활동내역을생성한다, EvaluationActivityLogDto> {
    private readonly commandBus;
    private readonly logger;
    constructor(commandBus: CommandBus);
    execute(command: 단계승인활동내역을생성한다): Promise<EvaluationActivityLogDto>;
}
