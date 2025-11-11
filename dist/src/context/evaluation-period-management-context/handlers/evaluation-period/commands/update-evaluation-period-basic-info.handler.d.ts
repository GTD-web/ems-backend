import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateEvaluationPeriodBasicDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateEvaluationPeriodBasicInfoCommand {
    readonly periodId: string;
    readonly updateData: UpdateEvaluationPeriodBasicDto;
    readonly updatedBy: string;
    constructor(periodId: string, updateData: UpdateEvaluationPeriodBasicDto, updatedBy: string);
}
export declare class UpdateEvaluationPeriodBasicInfoCommandHandler implements ICommandHandler<UpdateEvaluationPeriodBasicInfoCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: UpdateEvaluationPeriodBasicInfoCommand): Promise<EvaluationPeriodDto>;
}
