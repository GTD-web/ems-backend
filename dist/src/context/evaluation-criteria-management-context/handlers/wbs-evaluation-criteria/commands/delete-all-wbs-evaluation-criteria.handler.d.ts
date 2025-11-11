import { ICommandHandler } from '@nestjs/cqrs';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
export declare class DeleteAllWbsEvaluationCriteriaCommand {
    readonly deletedBy: string;
    constructor(deletedBy: string);
}
export declare class DeleteAllWbsEvaluationCriteriaHandler implements ICommandHandler<DeleteAllWbsEvaluationCriteriaCommand, boolean> {
    private readonly wbsEvaluationCriteriaService;
    private readonly logger;
    constructor(wbsEvaluationCriteriaService: WbsEvaluationCriteriaService);
    execute(command: DeleteAllWbsEvaluationCriteriaCommand): Promise<boolean>;
}
