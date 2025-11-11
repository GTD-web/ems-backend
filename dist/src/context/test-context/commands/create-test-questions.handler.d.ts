import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationQuestion } from '../../../domain/sub/evaluation-question/evaluation-question.entity';
import { EvaluationQuestionDto } from '../../../domain/sub/evaluation-question/evaluation-question.types';
export declare class CreateTestQuestionsCommand implements ICommand {
    readonly createdBy: string;
    constructor(createdBy: string);
}
export declare class CreateTestQuestionsHandler implements ICommandHandler<CreateTestQuestionsCommand, EvaluationQuestionDto[]> {
    private readonly evaluationQuestionRepository;
    constructor(evaluationQuestionRepository: Repository<EvaluationQuestion>);
    execute(command: CreateTestQuestionsCommand): Promise<EvaluationQuestionDto[]>;
}
