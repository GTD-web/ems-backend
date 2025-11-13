import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodAutoPhaseService } from '../../../../../domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateEvaluationPeriodScheduleDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateEvaluationPeriodScheduleCommand {
    readonly periodId: string;
    readonly scheduleData: UpdateEvaluationPeriodScheduleDto;
    readonly updatedBy: string;
    constructor(periodId: string, scheduleData: UpdateEvaluationPeriodScheduleDto, updatedBy: string);
}
export declare class UpdateEvaluationPeriodScheduleCommandHandler implements ICommandHandler<UpdateEvaluationPeriodScheduleCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    private readonly evaluationPeriodAutoPhaseService;
    constructor(evaluationPeriodService: EvaluationPeriodService, evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService);
    execute(command: UpdateEvaluationPeriodScheduleCommand): Promise<EvaluationPeriodDto>;
}
