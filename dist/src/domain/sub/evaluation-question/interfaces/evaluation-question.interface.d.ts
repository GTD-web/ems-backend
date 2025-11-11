import { IBaseEntity } from '@libs/database/base/base.entity';
export interface IEvaluationQuestion extends IBaseEntity {
    text: string;
    minScore?: number;
    maxScore?: number;
    질문내용업데이트한다(text: string, updatedBy: string): void;
    점수범위설정한다(minScore: number, maxScore: number, updatedBy: string): void;
    점수범위유효한가(): boolean;
    질문내용유효한가(): boolean;
}
