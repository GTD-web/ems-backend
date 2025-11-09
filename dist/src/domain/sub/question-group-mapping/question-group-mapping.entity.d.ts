import { BaseEntity } from '@libs/database/base/base.entity';
import { IQuestionGroupMapping } from './interfaces/question-group-mapping.interface';
import type { QuestionGroupMappingDto, CreateQuestionGroupMappingDto } from './question-group-mapping.types';
import { EvaluationQuestion } from '../evaluation-question/evaluation-question.entity';
import { QuestionGroup } from '../question-group/question-group.entity';
export declare class QuestionGroupMapping extends BaseEntity<QuestionGroupMappingDto> implements IQuestionGroupMapping {
    groupId: string;
    group?: QuestionGroup;
    questionId: string;
    question?: EvaluationQuestion;
    displayOrder: number;
    constructor(data?: CreateQuestionGroupMappingDto & {
        createdBy: string;
    });
    표시순서변경한다(order: number, updatedBy: string): void;
    그룹일치하는가(groupId: string): boolean;
    질문일치하는가(questionId: string): boolean;
    매핑일치하는가(groupId: string, questionId: string): boolean;
    DTO로_변환한다(): QuestionGroupMappingDto;
}
