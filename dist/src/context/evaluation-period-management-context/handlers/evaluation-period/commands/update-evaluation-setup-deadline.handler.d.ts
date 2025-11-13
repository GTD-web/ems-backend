import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodAutoPhaseService } from '../../../../../domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateEvaluationSetupDeadlineDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateEvaluationSetupDeadlineCommand {
    readonly periodId: string;
    readonly deadlineData: UpdateEvaluationSetupDeadlineDto;
    readonly updatedBy: string;
    constructor(periodId: string, deadlineData: UpdateEvaluationSetupDeadlineDto, updatedBy: string);
}
export declare class UpdateEvaluationSetupDeadlineCommandHandler implements ICommandHandler<UpdateEvaluationSetupDeadlineCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    private readonly evaluationPeriodAutoPhaseService;
    constructor(evaluationPeriodService: EvaluationPeriodService, evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService);
    execute(command: UpdateEvaluationSetupDeadlineCommand): Promise<EvaluationPeriodDto>;
}
