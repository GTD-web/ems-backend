import { ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { WbsAssignmentValidationService } from '../../../services/wbs-assignment-validation.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';
import type { EvaluationWbsAssignmentDto, CreateEvaluationWbsAssignmentData } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export declare class BulkCreateWbsAssignmentCommand {
    readonly assignments: CreateEvaluationWbsAssignmentData[];
    readonly assignedBy: string;
    constructor(assignments: CreateEvaluationWbsAssignmentData[], assignedBy: string);
}
export declare class BulkCreateWbsAssignmentHandler implements ICommandHandler<BulkCreateWbsAssignmentCommand> {
    private readonly dataSource;
    private readonly wbsAssignmentService;
    private readonly validationService;
    private readonly weightCalculationService;
    constructor(dataSource: DataSource, wbsAssignmentService: EvaluationWbsAssignmentService, validationService: WbsAssignmentValidationService, weightCalculationService: WbsAssignmentWeightCalculationService);
    execute(command: BulkCreateWbsAssignmentCommand): Promise<EvaluationWbsAssignmentDto[]>;
}
