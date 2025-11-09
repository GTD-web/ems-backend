import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import type { CreateEvaluationQuestionDto } from '../../../../../domain/sub/evaluation-question/evaluation-question.types';
export declare class CreateEvaluationQuestionCommand {
    readonly data: CreateEvaluationQuestionDto;
    readonly createdBy: string;
    constructor(data: CreateEvaluationQuestionDto, createdBy: string);
}
export declare class CreateEvaluationQuestionHandler implements ICommandHandler<CreateEvaluationQuestionCommand, string> {
    private readonly evaluationQuestionService;
    private readonly questionGroupMappingService;
    private readonly logger;
    constructor(evaluationQuestionService: EvaluationQuestionService, questionGroupMappingService: QuestionGroupMappingService);
    execute(command: CreateEvaluationQuestionCommand): Promise<string>;
}
