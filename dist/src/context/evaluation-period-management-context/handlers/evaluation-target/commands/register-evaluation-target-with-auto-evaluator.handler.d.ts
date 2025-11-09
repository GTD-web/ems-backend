import { ICommandHandler } from '@nestjs/cqrs';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
export declare class RegisterEvaluationTargetWithAutoEvaluatorCommand {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    readonly createdBy: string;
    constructor(evaluationPeriodId: string, employeeId: string, createdBy: string);
}
export interface RegisterWithAutoEvaluatorResult {
    mapping: EvaluationPeriodEmployeeMappingDto;
    primaryEvaluatorAssigned: boolean;
    primaryEvaluatorId: string | null;
    warning: string | null;
}
export declare class RegisterEvaluationTargetWithAutoEvaluatorHandler implements ICommandHandler<RegisterEvaluationTargetWithAutoEvaluatorCommand, RegisterWithAutoEvaluatorResult> {
    private readonly commandBus;
    private readonly queryBus;
    private readonly logger;
    constructor(commandBus: CommandBus, queryBus: QueryBus);
    execute(command: RegisterEvaluationTargetWithAutoEvaluatorCommand): Promise<RegisterWithAutoEvaluatorResult>;
}
