import { Repository, EntityTarget, DataSource, FindOptionsWhere, FindManyOptions, FindOneOptions, ObjectLiteral } from 'typeorm';
import { Logger } from '@nestjs/common';
export declare abstract class BaseRepository<TEntity extends ObjectLiteral, TId = string | number> {
    protected readonly dataSource: DataSource;
    private readonly entityTarget;
    protected readonly logger: Logger;
    protected readonly repository: Repository<TEntity>;
    constructor(dataSource: DataSource, entityTarget: EntityTarget<TEntity>);
    findById(id: TId): Promise<TEntity | null>;
    findOne(options: FindOneOptions<TEntity>): Promise<TEntity | null>;
    findMany(options?: FindManyOptions<TEntity>): Promise<TEntity[]>;
    count(options?: FindManyOptions<TEntity>): Promise<number>;
    exists(options: FindOptionsWhere<TEntity>): Promise<boolean>;
    save(entity: TEntity): Promise<TEntity>;
    saveMany(entities: TEntity[]): Promise<TEntity[]>;
    delete(id: TId): Promise<void>;
    deleteMany(criteria: FindOptionsWhere<TEntity>): Promise<void>;
    softDelete(id: TId): Promise<void>;
    restore(id: TId): Promise<void>;
    runInTransaction<TResult>(operation: (repository: Repository<TEntity>) => Promise<TResult>): Promise<TResult>;
    createQueryBuilder(alias?: string): import("typeorm").SelectQueryBuilder<TEntity>;
    getRepository(): Repository<TEntity>;
}
