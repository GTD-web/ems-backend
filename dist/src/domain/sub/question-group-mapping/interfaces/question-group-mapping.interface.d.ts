import { IBaseEntity } from '@libs/database/base/base.entity';
export interface IQuestionGroupMapping extends IBaseEntity {
    groupId: string;
    questionId: string;
    displayOrder: number;
    표시순서변경한다(order: number, updatedBy: string): void;
    그룹일치하는가(groupId: string): boolean;
    질문일치하는가(questionId: string): boolean;
    매핑일치하는가(groupId: string, questionId: string): boolean;
}
