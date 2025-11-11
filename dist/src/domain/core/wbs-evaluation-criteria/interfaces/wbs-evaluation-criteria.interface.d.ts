import { IBaseEntity } from '@libs/database/base/base.entity';
export interface IWbsEvaluationCriteria extends IBaseEntity {
    wbsItemId: string;
    criteria: string;
    importance: number;
    기준내용업데이트한다(criteria: string, importance: number, updatedBy: string): void;
    WBS항목일치하는가(wbsItemId: string): boolean;
    유효한가(): boolean;
}
