import { FindManyOptions, FindOneOptions, FindOptionsWhere } from 'typeorm';
export interface IRepository<TEntity, TId = string | number> {
    findById(id: TId): Promise<TEntity | null>;
    findOne(options: FindOneOptions<TEntity>): Promise<TEntity | null>;
    findMany(options?: FindManyOptions<TEntity>): Promise<TEntity[]>;
    save(entity: TEntity): Promise<TEntity>;
    delete(id: TId): Promise<void>;
    exists(options: FindOptionsWhere<TEntity>): Promise<boolean>;
}
export interface IAggregateRepository<TAggregate, TId = string | number> extends IRepository<TAggregate, TId> {
    saveAggregate(aggregate: TAggregate): Promise<TAggregate>;
    saveAggregateInTransaction(aggregate: TAggregate, operation?: (aggregate: TAggregate) => Promise<void>): Promise<TAggregate>;
}
export interface IReadOnlyRepository<TView, TId = string | number> {
    findById(id: TId): Promise<TView | null>;
    findOne(options: FindOneOptions<TView>): Promise<TView | null>;
    findMany(options?: FindManyOptions<TView>): Promise<TView[]>;
    findWithPagination(options: FindManyOptions<TView>, page: number, limit: number): Promise<{
        data: TView[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    count(options?: FindManyOptions<TView>): Promise<number>;
}
export interface IDomainEvent {
    eventId: string;
    eventType: string;
    occurredAt: Date;
    aggregateId: string | number;
    eventData: Record<string, any>;
}
export interface IAggregateRoot {
    getDomainEvents(): IDomainEvent[];
    addDomainEvent(event: IDomainEvent): void;
    clearDomainEvents(): void;
}
export interface IUnitOfWork {
    registerNew<T>(entity: T): void;
    registerDirty<T>(entity: T): void;
    registerDeleted<T>(entity: T): void;
    commit(): Promise<void>;
    rollback(): Promise<void>;
}
