import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { QuestionGroup } from '../../../domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '../../../domain/sub/evaluation-question/evaluation-question.entity';
import { QuestionGroupMapping } from '../../../domain/sub/question-group-mapping/question-group-mapping.entity';
export interface CleanupEvaluationQuestionDataResult {
    mappings: number;
    questions: number;
    groups: number;
}
export declare class CleanupEvaluationQuestionDataCommand implements ICommand {
}
export declare class CleanupEvaluationQuestionDataHandler implements ICommandHandler<CleanupEvaluationQuestionDataCommand, CleanupEvaluationQuestionDataResult> {
    private readonly questionGroupRepository;
    private readonly evaluationQuestionRepository;
    private readonly questionGroupMappingRepository;
    constructor(questionGroupRepository: Repository<QuestionGroup>, evaluationQuestionRepository: Repository<EvaluationQuestion>, questionGroupMappingRepository: Repository<QuestionGroupMapping>);
    execute(command: CleanupEvaluationQuestionDataCommand): Promise<CleanupEvaluationQuestionDataResult>;
}
