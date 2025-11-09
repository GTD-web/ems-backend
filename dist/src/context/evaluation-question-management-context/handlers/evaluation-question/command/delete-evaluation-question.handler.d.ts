import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
export declare class DeleteEvaluationQuestionCommand {
    readonly id: string;
    readonly deletedBy: string;
    constructor(id: string, deletedBy: string);
}
export declare class DeleteEvaluationQuestionHandler implements ICommandHandler<DeleteEvaluationQuestionCommand, void> {
    private readonly evaluationQuestionService;
    private readonly logger;
    constructor(evaluationQuestionService: EvaluationQuestionService);
    execute(command: DeleteEvaluationQuestionCommand): Promise<void>;
}
