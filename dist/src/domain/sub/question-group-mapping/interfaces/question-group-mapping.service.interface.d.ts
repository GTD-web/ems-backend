import { EntityManager } from 'typeorm';
import type { IQuestionGroupMapping } from './question-group-mapping.interface';
import type { CreateQuestionGroupMappingDto, UpdateQuestionGroupMappingDto, QuestionGroupMappingFilter } from '../question-group-mapping.types';
export interface IQuestionGroupMappingService {
    ID로조회한다(id: string, manager?: EntityManager): Promise<IQuestionGroupMapping | null>;
    그룹ID로조회한다(groupId: string, manager?: EntityManager): Promise<IQuestionGroupMapping[]>;
    질문ID로조회한다(questionId: string, manager?: EntityManager): Promise<IQuestionGroupMapping[]>;
    그룹질문으로조회한다(groupId: string, questionId: string, manager?: EntityManager): Promise<IQuestionGroupMapping | null>;
    필터조회한다(filter: QuestionGroupMappingFilter, manager?: EntityManager): Promise<IQuestionGroupMapping[]>;
    생성한다(createDto: CreateQuestionGroupMappingDto, createdBy: string, manager?: EntityManager): Promise<IQuestionGroupMapping>;
    업데이트한다(id: string, updateDto: UpdateQuestionGroupMappingDto, updatedBy: string, manager?: EntityManager): Promise<IQuestionGroupMapping>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    그룹매핑전체삭제한다(groupId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    질문매핑전체삭제한다(questionId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    매핑중복확인한다(groupId: string, questionId: string, manager?: EntityManager): Promise<boolean>;
    그룹내질문개수조회한다(groupId: string, manager?: EntityManager): Promise<number>;
    질문의그룹개수조회한다(questionId: string, manager?: EntityManager): Promise<number>;
}
