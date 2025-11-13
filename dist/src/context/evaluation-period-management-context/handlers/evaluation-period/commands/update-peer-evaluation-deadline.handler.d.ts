import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodAutoPhaseService } from '../../../../../domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdatePeerEvaluationDeadlineDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdatePeerEvaluationDeadlineCommand {
    readonly periodId: string;
    readonly deadlineData: UpdatePeerEvaluationDeadlineDto;
    readonly updatedBy: string;
    constructor(periodId: string, deadlineData: UpdatePeerEvaluationDeadlineDto, updatedBy: string);
}
export declare class UpdatePeerEvaluationDeadlineCommandHandler implements ICommandHandler<UpdatePeerEvaluationDeadlineCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    private readonly evaluationPeriodAutoPhaseService;
    constructor(evaluationPeriodService: EvaluationPeriodService, evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService);
    execute(command: UpdatePeerEvaluationDeadlineCommand): Promise<EvaluationPeriodDto>;
}
