import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import { QuestionGroupMapping } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.entity';
import { QuestionGroup } from '../../../../../domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '../../../../../domain/sub/evaluation-question/evaluation-question.entity';
import type { CreateQuestionGroupMappingDto } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.types';
export declare class AddQuestionToGroupCommand {
    readonly data: CreateQuestionGroupMappingDto;
    readonly createdBy: string;
    constructor(data: CreateQuestionGroupMappingDto, createdBy: string);
}
export declare class AddQuestionToGroupHandler implements ICommandHandler<AddQuestionToGroupCommand, string> {
    private readonly questionGroupMappingService;
    private readonly questionGroupMappingRepository;
    private readonly questionGroupRepository;
    private readonly evaluationQuestionRepository;
    private readonly logger;
    constructor(questionGroupMappingService: QuestionGroupMappingService, questionGroupMappingRepository: Repository<QuestionGroupMapping>, questionGroupRepository: Repository<QuestionGroup>, evaluationQuestionRepository: Repository<EvaluationQuestion>);
    execute(command: AddQuestionToGroupCommand): Promise<string>;
}
