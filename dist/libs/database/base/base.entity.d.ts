export interface IBaseEntity<T = any> {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    삭제되었는가(): boolean;
    새로_생성되었는가(): boolean;
    생성자를_설정한다(userId: string): void;
    수정자를_설정한다(userId: string): void;
    메타데이터를_업데이트한다(userId?: string): void;
    DTO로_변환한다(): T;
}
export interface IBaseEntityWithNumericId<T = any> {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    삭제되었는가(): boolean;
    새로_생성되었는가(): boolean;
    생성자를_설정한다(userId: string): void;
    수정자를_설정한다(userId: string): void;
    메타데이터를_업데이트한다(userId?: string): void;
    DTO로_변환한다(): T;
}
export declare abstract class BaseEntity<T> implements IBaseEntity<T> {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    protected validateUuidFormat(value: string, fieldName: string): void;
    protected validateUuidFields(fields: {
        value: string;
        name: string;
    }[]): void;
    삭제되었는가(): boolean;
    새로_생성되었는가(): boolean;
    생성자를_설정한다(userId: string): void;
    수정자를_설정한다(userId: string): void;
    메타데이터를_업데이트한다(userId?: string): void;
    abstract DTO로_변환한다(): T;
    get isDeleted(): boolean;
    get isNew(): boolean;
    setCreatedBy(userId: string): void;
    setUpdatedBy(userId: string): void;
    updateMetadata(userId?: string): void;
}
export declare abstract class BaseEntityWithNumericId<T> implements IBaseEntityWithNumericId<T> {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    삭제되었는가(): boolean;
    새로_생성되었는가(): boolean;
    생성자를_설정한다(userId: string): void;
    수정자를_설정한다(userId: string): void;
    메타데이터를_업데이트한다(userId?: string): void;
    abstract DTO로_변환한다(): T;
    get isDeleted(): boolean;
    get isNew(): boolean;
    setCreatedBy(userId: string): void;
    setUpdatedBy(userId: string): void;
    updateMetadata(userId?: string): void;
}
