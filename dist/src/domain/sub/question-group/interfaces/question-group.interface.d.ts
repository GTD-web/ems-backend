import { IBaseEntity } from '@libs/database/base/base.entity';
export interface IQuestionGroup extends IBaseEntity {
    name: string;
    isDefault: boolean;
    isDeletable: boolean;
    그룹명업데이트한다(name: string, updatedBy: string): void;
    기본그룹설정한다(isDefault: boolean, updatedBy: string): void;
    삭제가능여부설정한다(isDeletable: boolean, updatedBy: string): void;
    삭제가능한가(): boolean;
    기본그룹인가(): boolean;
    유효한그룹명인가(): boolean;
}
