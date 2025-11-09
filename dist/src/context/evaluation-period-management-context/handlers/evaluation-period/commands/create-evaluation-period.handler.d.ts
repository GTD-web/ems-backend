import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { CreateEvaluationPeriodMinimalDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class CreateEvaluationPeriodCommand {
    readonly createData: CreateEvaluationPeriodMinimalDto;
    readonly createdBy: string;
    constructor(createData: CreateEvaluationPeriodMinimalDto, createdBy: string);
}
export declare class CreateEvaluationPeriodCommandHandler implements ICommandHandler<CreateEvaluationPeriodCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: CreateEvaluationPeriodCommand): Promise<EvaluationPeriodDto>;
}
