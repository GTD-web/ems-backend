import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import { QuestionGroup } from '../../../../../domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '../../../../../domain/sub/evaluation-question/evaluation-question.entity';
export declare class AddMultipleQuestionsToGroupCommand {
    readonly groupId: string;
    readonly questionIds: string[];
    readonly startDisplayOrder: number;
    readonly createdBy: string;
    constructor(groupId: string, questionIds: string[], startDisplayOrder: number, createdBy: string);
}
export declare class AddMultipleQuestionsToGroupHandler implements ICommandHandler<AddMultipleQuestionsToGroupCommand, string[]> {
    private readonly questionGroupMappingService;
    private readonly questionGroupRepository;
    private readonly evaluationQuestionRepository;
    private readonly logger;
    constructor(questionGroupMappingService: QuestionGroupMappingService, questionGroupRepository: Repository<QuestionGroup>, evaluationQuestionRepository: Repository<EvaluationQuestion>);
    execute(command: AddMultipleQuestionsToGroupCommand): Promise<string[]>;
}
