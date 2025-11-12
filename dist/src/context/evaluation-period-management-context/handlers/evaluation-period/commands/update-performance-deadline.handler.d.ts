import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodAutoPhaseService } from '../../../../../domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdatePerformanceDeadlineDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdatePerformanceDeadlineCommand {
    readonly periodId: string;
    readonly deadlineData: UpdatePerformanceDeadlineDto;
    readonly updatedBy: string;
    constructor(periodId: string, deadlineData: UpdatePerformanceDeadlineDto, updatedBy: string);
}
export declare class UpdatePerformanceDeadlineCommandHandler implements ICommandHandler<UpdatePerformanceDeadlineCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    private readonly evaluationPeriodAutoPhaseService;
    constructor(evaluationPeriodService: EvaluationPeriodService, evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService);
    execute(command: UpdatePerformanceDeadlineCommand): Promise<EvaluationPeriodDto>;
}
