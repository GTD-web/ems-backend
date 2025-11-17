import { DataSource, EntityManager, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { IAggregateRoot } from './interfaces/repository.interface';
export declare enum DatabaseErrorType {
    CONNECTION_ERROR = "CONNECTION_ERROR",
    CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
    FOREIGN_KEY_VIOLATION = "FOREIGN_KEY_VIOLATION",
    UNIQUE_VIOLATION = "UNIQUE_VIOLATION",
    NOT_NULL_VIOLATION = "NOT_NULL_VIOLATION",
    CHECK_VIOLATION = "CHECK_VIOLATION",
    DEADLOCK = "DEADLOCK",
    TIMEOUT = "TIMEOUT",
    SERIALIZATION_FAILURE = "SERIALIZATION_FAILURE",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare class DatabaseException extends Error {
    readonly type: DatabaseErrorType;
    readonly originalError: any;
    readonly query?: string | undefined;
    readonly parameters?: any[] | undefined;
    constructor(type: DatabaseErrorType, originalError: any, query?: string | undefined, parameters?: any[] | undefined);
}
export interface DomainExecutionContext {
    executeSafeOperation<T>(operation: () => Promise<T>, context: string): Promise<T>;
}
export declare class TransactionManagerService {
    private readonly dataSource;
    private readonly logger;
    private readonly errorHandlers;
    constructor(dataSource: DataSource);
    private isHttpException;
    private handleDatabaseError;
    private isRetryableError;
    private executeWithRetry;
    executeTransaction<T>(operation: (manager: EntityManager) => Promise<T>, maxRetries?: number): Promise<T>;
    executeNestedTransaction<T>(operation: (manager: EntityManager) => Promise<T>, savepointName?: string, maxRetries?: number): Promise<T>;
    executeBatchTransaction<T>(operations: Array<(manager: EntityManager) => Promise<T>>): Promise<T[]>;
    executeTransactionWithDomainEvents<T>(aggregates: IAggregateRoot[], operation: (manager: EntityManager) => Promise<T>): Promise<T>;
    executeReadOnlyTransaction<T>(operation: (manager: EntityManager) => Promise<T>, maxRetries?: number): Promise<T>;
    executeTransactionWithIsolationLevel<T>(isolationLevel: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE', operation: (manager: EntityManager) => Promise<T>, maxRetries?: number): Promise<T>;
    getRepository<T extends ObjectLiteral>(entityClass: EntityTarget<T>, defaultRepository: Repository<T>, manager?: EntityManager): Repository<T>;
    registerDomainErrorHandler(domain: string): void;
    createDomainContext(domain: string): DomainExecutionContext;
    executeDomainOperation<T>(operation: () => Promise<T>, context: string, domain: string): Promise<T>;
    executeSafeOperation<T>(operation: () => Promise<T>, context: string, errorHandler?: (error: DatabaseException) => Error | null): Promise<T>;
    private processDomainEvents;
}
