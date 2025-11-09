import { ICommandHandler } from '@nestjs/cqrs';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';
export declare class DeleteWbsEvaluationCriteriaCommand {
    readonly id: string;
    readonly deletedBy: string;
    constructor(id: string, deletedBy: string);
}
export declare class DeleteWbsEvaluationCriteriaHandler implements ICommandHandler<DeleteWbsEvaluationCriteriaCommand, boolean> {
    private readonly wbsEvaluationCriteriaService;
    private readonly weightCalculationService;
    private readonly logger;
    constructor(wbsEvaluationCriteriaService: WbsEvaluationCriteriaService, weightCalculationService: WbsAssignmentWeightCalculationService);
    execute(command: DeleteWbsEvaluationCriteriaCommand): Promise<boolean>;
}
