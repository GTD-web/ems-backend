import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateSelfEvaluationDeadlineDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateSelfEvaluationDeadlineCommand {
    readonly periodId: string;
    readonly deadlineData: UpdateSelfEvaluationDeadlineDto;
    readonly updatedBy: string;
    constructor(periodId: string, deadlineData: UpdateSelfEvaluationDeadlineDto, updatedBy: string);
}
export declare class UpdateSelfEvaluationDeadlineCommandHandler implements ICommandHandler<UpdateSelfEvaluationDeadlineCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: UpdateSelfEvaluationDeadlineCommand): Promise<EvaluationPeriodDto>;
}
