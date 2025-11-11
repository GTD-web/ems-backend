import { ICommandHandler } from '@nestjs/cqrs';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { UpdateWbsEvaluationCriteriaData } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';
export declare class UpdateWbsEvaluationCriteriaCommand {
    readonly id: string;
    readonly updateData: UpdateWbsEvaluationCriteriaData;
    readonly updatedBy: string;
    constructor(id: string, updateData: UpdateWbsEvaluationCriteriaData, updatedBy: string);
}
export declare class UpdateWbsEvaluationCriteriaHandler implements ICommandHandler<UpdateWbsEvaluationCriteriaCommand> {
    private readonly wbsEvaluationCriteriaService;
    private readonly weightCalculationService;
    private readonly logger;
    constructor(wbsEvaluationCriteriaService: WbsEvaluationCriteriaService, weightCalculationService: WbsAssignmentWeightCalculationService);
    execute(command: UpdateWbsEvaluationCriteriaCommand): Promise<any>;
}
