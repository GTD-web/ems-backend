import { ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { WbsAssignmentValidationService } from '../../../services/wbs-assignment-validation.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';
import type { EvaluationWbsAssignmentDto, CreateEvaluationWbsAssignmentData } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export declare class CreateWbsAssignmentCommand {
    readonly data: CreateEvaluationWbsAssignmentData;
    readonly assignedBy: string;
    constructor(data: CreateEvaluationWbsAssignmentData, assignedBy: string);
}
export declare class CreateWbsAssignmentHandler implements ICommandHandler<CreateWbsAssignmentCommand> {
    private readonly dataSource;
    private readonly wbsAssignmentService;
    private readonly validationService;
    private readonly weightCalculationService;
    constructor(dataSource: DataSource, wbsAssignmentService: EvaluationWbsAssignmentService, validationService: WbsAssignmentValidationService, weightCalculationService: WbsAssignmentWeightCalculationService);
    execute(command: CreateWbsAssignmentCommand): Promise<EvaluationWbsAssignmentDto>;
}
