import { BaseEntity } from '@libs/database/base/base.entity';
import { IQuestionGroup } from './interfaces/question-group.interface';
import type { QuestionGroupDto, CreateQuestionGroupDto } from './question-group.types';
export declare class QuestionGroup extends BaseEntity<QuestionGroupDto> implements IQuestionGroup {
    name: string;
    isDefault: boolean;
    isDeletable: boolean;
    constructor(data?: CreateQuestionGroupDto & {
        createdBy: string;
    });
    그룹명업데이트한다(name: string, updatedBy: string): void;
    기본그룹설정한다(isDefault: boolean, updatedBy: string): void;
    삭제가능여부설정한다(isDeletable: boolean, updatedBy: string): void;
    삭제가능한가(): boolean;
    기본그룹인가(): boolean;
    유효한그룹명인가(): boolean;
    DTO로_변환한다(): QuestionGroupDto;
}
