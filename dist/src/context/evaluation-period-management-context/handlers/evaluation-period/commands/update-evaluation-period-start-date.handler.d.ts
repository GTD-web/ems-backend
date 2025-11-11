import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateEvaluationPeriodStartDateDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateEvaluationPeriodStartDateCommand {
    readonly periodId: string;
    readonly startDateData: UpdateEvaluationPeriodStartDateDto;
    readonly updatedBy: string;
    constructor(periodId: string, startDateData: UpdateEvaluationPeriodStartDateDto, updatedBy: string);
}
export declare class UpdateEvaluationPeriodStartDateCommandHandler implements ICommandHandler<UpdateEvaluationPeriodStartDateCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: UpdateEvaluationPeriodStartDateCommand): Promise<EvaluationPeriodDto>;
}
