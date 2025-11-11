import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
export declare class CopyEvaluationQuestionCommand {
    readonly id: string;
    readonly copiedBy: string;
    constructor(id: string, copiedBy: string);
}
export declare class CopyEvaluationQuestionHandler implements ICommandHandler<CopyEvaluationQuestionCommand, string> {
    private readonly evaluationQuestionService;
    private readonly logger;
    constructor(evaluationQuestionService: EvaluationQuestionService);
    execute(command: CopyEvaluationQuestionCommand): Promise<string>;
}
