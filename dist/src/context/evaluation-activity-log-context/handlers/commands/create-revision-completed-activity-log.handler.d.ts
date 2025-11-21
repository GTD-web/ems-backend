import { ICommandHandler, CommandBus } from '@nestjs/cqrs';
import type { RevisionRequestStepType } from '@domain/sub/evaluation-revision-request';
import type { EvaluationActivityLogDto } from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';
export declare class 재작성완료활동내역을생성한다 {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    readonly step: RevisionRequestStepType;
    readonly requestId: string;
    readonly performedBy: string;
    readonly responseComment: string;
    readonly allCompleted: boolean;
    constructor(evaluationPeriodId: string, employeeId: string, step: RevisionRequestStepType, requestId: string, performedBy: string, responseComment: string, allCompleted: boolean);
}
export declare class CreateRevisionCompletedActivityLogHandler implements ICommandHandler<재작성완료활동내역을생성한다, EvaluationActivityLogDto> {
    private readonly commandBus;
    private readonly logger;
    constructor(commandBus: CommandBus);
    execute(command: 재작성완료활동내역을생성한다): Promise<EvaluationActivityLogDto>;
}
