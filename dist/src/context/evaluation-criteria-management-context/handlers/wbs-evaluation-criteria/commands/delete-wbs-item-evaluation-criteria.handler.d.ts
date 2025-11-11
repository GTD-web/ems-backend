import { ICommandHandler } from '@nestjs/cqrs';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';
export declare class DeleteWbsItemEvaluationCriteriaCommand {
    readonly wbsItemId: string;
    readonly deletedBy: string;
    constructor(wbsItemId: string, deletedBy: string);
}
export declare class DeleteWbsItemEvaluationCriteriaHandler implements ICommandHandler<DeleteWbsItemEvaluationCriteriaCommand, boolean> {
    private readonly wbsEvaluationCriteriaService;
    private readonly weightCalculationService;
    private readonly logger;
    constructor(wbsEvaluationCriteriaService: WbsEvaluationCriteriaService, weightCalculationService: WbsAssignmentWeightCalculationService);
    execute(command: DeleteWbsItemEvaluationCriteriaCommand): Promise<boolean>;
}
