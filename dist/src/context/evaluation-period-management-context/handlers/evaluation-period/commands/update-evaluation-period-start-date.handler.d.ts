import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { UpdateEvaluationPeriodStartDateDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateEvaluationPeriodStartDateCommand {
    readonly periodId: string;
    readonly startDateData: UpdateEvaluationPeriodStartDateDto;
    readonly updatedBy: string;
    constructor(periodId: string, startDateData: UpdateEvaluationPeriodStartDateDto, updatedBy: string);
}
export declare class UpdateEvaluationPeriodStartDateCommandHandler implements ICommandHandler<UpdateEvaluationPeriodStartDateCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    private readonly evaluationPeriodAutoPhaseService;
    constructor(evaluationPeriodService: EvaluationPeriodService, evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService);
    execute(command: UpdateEvaluationPeriodStartDateCommand): Promise<EvaluationPeriodDto>;
}
