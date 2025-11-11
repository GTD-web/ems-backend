import { ICommandHandler } from '@nestjs/cqrs';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { CreateEvaluationPeriodMinimalDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class CreateEvaluationPeriodWithAutoTargetsCommand {
    readonly createData: CreateEvaluationPeriodMinimalDto;
    readonly createdBy: string;
    constructor(createData: CreateEvaluationPeriodMinimalDto, createdBy: string);
}
export interface CreateEvaluationPeriodWithTargetsResult {
    evaluationPeriod: EvaluationPeriodDto;
    registeredTargetsCount: number;
    autoAssignedEvaluatorsCount: number;
    warnings: string[];
}
export declare class CreateEvaluationPeriodWithAutoTargetsHandler implements ICommandHandler<CreateEvaluationPeriodWithAutoTargetsCommand, CreateEvaluationPeriodWithTargetsResult> {
    private readonly commandBus;
    private readonly queryBus;
    private readonly logger;
    constructor(commandBus: CommandBus, queryBus: QueryBus);
    execute(command: CreateEvaluationPeriodWithAutoTargetsCommand): Promise<CreateEvaluationPeriodWithTargetsResult>;
}
