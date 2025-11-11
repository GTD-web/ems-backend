import { Repository } from 'typeorm';
import { QuestionGroupMapping } from './question-group-mapping.entity';
import type { CreateQuestionGroupMappingDto, UpdateQuestionGroupMappingDto, QuestionGroupMappingFilter } from './question-group-mapping.types';
import type { IQuestionGroupMappingService } from './interfaces/question-group-mapping.service.interface';
export declare class QuestionGroupMappingService implements IQuestionGroupMappingService {
    private readonly mappingRepository;
    private readonly logger;
    constructor(mappingRepository: Repository<QuestionGroupMapping>);
    ID로조회한다(id: string): Promise<QuestionGroupMapping | null>;
    그룹ID로조회한다(groupId: string): Promise<QuestionGroupMapping[]>;
    질문ID로조회한다(questionId: string): Promise<QuestionGroupMapping[]>;
    그룹질문으로조회한다(groupId: string, questionId: string): Promise<QuestionGroupMapping | null>;
    필터조회한다(filter: QuestionGroupMappingFilter): Promise<QuestionGroupMapping[]>;
    생성한다(createDto: CreateQuestionGroupMappingDto, createdBy: string): Promise<QuestionGroupMapping>;
    업데이트한다(id: string, updateDto: UpdateQuestionGroupMappingDto, updatedBy: string): Promise<QuestionGroupMapping>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    그룹매핑전체삭제한다(groupId: string, deletedBy: string): Promise<void>;
    질문매핑전체삭제한다(questionId: string, deletedBy: string): Promise<void>;
    매핑중복확인한다(groupId: string, questionId: string): Promise<boolean>;
    그룹내질문개수조회한다(groupId: string): Promise<number>;
    질문의그룹개수조회한다(questionId: string): Promise<number>;
}
