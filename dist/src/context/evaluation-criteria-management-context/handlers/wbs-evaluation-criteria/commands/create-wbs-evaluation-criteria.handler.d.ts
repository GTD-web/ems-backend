import { ICommandHandler } from '@nestjs/cqrs';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { CreateWbsEvaluationCriteriaData } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';
export declare class CreateWbsEvaluationCriteriaCommand {
    readonly createData: CreateWbsEvaluationCriteriaData;
    readonly createdBy: string;
    constructor(createData: CreateWbsEvaluationCriteriaData, createdBy: string);
}
export declare class CreateWbsEvaluationCriteriaHandler implements ICommandHandler<CreateWbsEvaluationCriteriaCommand> {
    private readonly wbsEvaluationCriteriaService;
    private readonly weightCalculationService;
    private readonly logger;
    constructor(wbsEvaluationCriteriaService: WbsEvaluationCriteriaService, weightCalculationService: WbsAssignmentWeightCalculationService);
    execute(command: CreateWbsEvaluationCriteriaCommand): Promise<any>;
}
