import { EntityManager } from 'typeorm';
import type { IQuestionGroup } from './question-group.interface';
import type { CreateQuestionGroupDto, UpdateQuestionGroupDto, QuestionGroupFilter } from '../question-group.types';
export interface IQuestionGroupService {
    ID로조회한다(id: string, manager?: EntityManager): Promise<IQuestionGroup | null>;
    그룹명으로조회한다(name: string, manager?: EntityManager): Promise<IQuestionGroup | null>;
    기본그룹조회한다(manager?: EntityManager): Promise<IQuestionGroup | null>;
    전체조회한다(manager?: EntityManager): Promise<IQuestionGroup[]>;
    필터조회한다(filter: QuestionGroupFilter, manager?: EntityManager): Promise<IQuestionGroup[]>;
    삭제가능그룹조회한다(manager?: EntityManager): Promise<IQuestionGroup[]>;
    생성한다(createDto: CreateQuestionGroupDto, createdBy: string, manager?: EntityManager): Promise<IQuestionGroup>;
    업데이트한다(id: string, updateDto: UpdateQuestionGroupDto, updatedBy: string, manager?: EntityManager): Promise<IQuestionGroup>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    그룹명중복확인한다(name: string, excludeId?: string, manager?: EntityManager): Promise<boolean>;
    그룹내질문존재확인한다(groupId: string, manager?: EntityManager): Promise<boolean>;
    그룹내질문개수조회한다(groupId: string, manager?: EntityManager): Promise<number>;
    기본그룹설정한다(groupId: string, updatedBy: string, manager?: EntityManager): Promise<void>;
}
