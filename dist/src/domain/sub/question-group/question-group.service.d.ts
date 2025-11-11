import { Repository } from 'typeorm';
import { QuestionGroup } from './question-group.entity';
import type { CreateQuestionGroupDto, UpdateQuestionGroupDto, QuestionGroupFilter } from './question-group.types';
import type { IQuestionGroupService } from './interfaces/question-group.service.interface';
export declare class QuestionGroupService implements IQuestionGroupService {
    private readonly questionGroupRepository;
    private readonly logger;
    constructor(questionGroupRepository: Repository<QuestionGroup>);
    ID로조회한다(id: string): Promise<QuestionGroup | null>;
    그룹명으로조회한다(name: string): Promise<QuestionGroup | null>;
    기본그룹조회한다(): Promise<QuestionGroup | null>;
    전체조회한다(): Promise<QuestionGroup[]>;
    필터조회한다(filter: QuestionGroupFilter): Promise<QuestionGroup[]>;
    삭제가능그룹조회한다(): Promise<QuestionGroup[]>;
    생성한다(createDto: CreateQuestionGroupDto, createdBy: string): Promise<QuestionGroup>;
    업데이트한다(id: string, updateDto: UpdateQuestionGroupDto, updatedBy: string): Promise<QuestionGroup>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    그룹명중복확인한다(name: string, excludeId?: string): Promise<boolean>;
    그룹내질문존재확인한다(groupId: string): Promise<boolean>;
    그룹내질문개수조회한다(groupId: string): Promise<number>;
    기본그룹설정한다(groupId: string, updatedBy: string): Promise<void>;
}
