import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
import type { UpdateEvaluationQuestionDto } from '../../../../../domain/sub/evaluation-question/evaluation-question.types';
export declare class UpdateEvaluationQuestionCommand {
    readonly id: string;
    readonly data: UpdateEvaluationQuestionDto;
    readonly updatedBy: string;
    constructor(id: string, data: UpdateEvaluationQuestionDto, updatedBy: string);
}
export declare class UpdateEvaluationQuestionHandler implements ICommandHandler<UpdateEvaluationQuestionCommand, void> {
    private readonly evaluationQuestionService;
    private readonly logger;
    constructor(evaluationQuestionService: EvaluationQuestionService);
    execute(command: UpdateEvaluationQuestionCommand): Promise<void>;
}
