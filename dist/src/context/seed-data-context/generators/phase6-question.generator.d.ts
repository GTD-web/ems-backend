import { Repository } from 'typeorm';
import { QuestionGroup } from '@domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '@domain/sub/evaluation-question/evaluation-question.entity';
import { QuestionGroupMapping } from '@domain/sub/question-group-mapping/question-group-mapping.entity';
import { SeedDataConfig, GeneratorResult } from '../types';
export declare class Phase6QuestionGenerator {
    private readonly questionGroupRepository;
    private readonly evaluationQuestionRepository;
    private readonly questionGroupMappingRepository;
    private readonly logger;
    constructor(questionGroupRepository: Repository<QuestionGroup>, evaluationQuestionRepository: Repository<EvaluationQuestion>, questionGroupMappingRepository: Repository<QuestionGroupMapping>);
    generate(config: SeedDataConfig, phase1Result: GeneratorResult): Promise<GeneratorResult>;
    private 생성_파트장평가질문그룹;
    private 생성_질문그룹들;
    private 생성_평가질문들;
    private 생성_질문그룹매핑들;
    private 랜덤_선택;
    private 배치로_저장한다;
}
