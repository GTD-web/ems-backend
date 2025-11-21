"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TransactionManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManagerService = exports.DatabaseException = exports.DatabaseErrorType = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
var DatabaseErrorType;
(function (DatabaseErrorType) {
    DatabaseErrorType["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    DatabaseErrorType["CONSTRAINT_VIOLATION"] = "CONSTRAINT_VIOLATION";
    DatabaseErrorType["FOREIGN_KEY_VIOLATION"] = "FOREIGN_KEY_VIOLATION";
    DatabaseErrorType["UNIQUE_VIOLATION"] = "UNIQUE_VIOLATION";
    DatabaseErrorType["NOT_NULL_VIOLATION"] = "NOT_NULL_VIOLATION";
    DatabaseErrorType["CHECK_VIOLATION"] = "CHECK_VIOLATION";
    DatabaseErrorType["DEADLOCK"] = "DEADLOCK";
    DatabaseErrorType["TIMEOUT"] = "TIMEOUT";
    DatabaseErrorType["SERIALIZATION_FAILURE"] = "SERIALIZATION_FAILURE";
    DatabaseErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(DatabaseErrorType || (exports.DatabaseErrorType = DatabaseErrorType = {}));
class DatabaseException extends Error {
    type;
    originalError;
    query;
    parameters;
    constructor(type, originalError, query, parameters) {
        super(originalError.message);
        this.type = type;
        this.originalError = originalError;
        this.query = query;
        this.parameters = parameters;
        this.name = 'DatabaseException';
    }
}
exports.DatabaseException = DatabaseException;
let TransactionManagerService = TransactionManagerService_1 = class TransactionManagerService {
    dataSource;
    logger = new common_1.Logger(TransactionManagerService_1.name);
    errorHandlers = new Map();
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    isHttpException(error) {
        return ((error.response && error.status) ||
            (typeof error.statusCode === 'number' &&
                error.statusCode >= 400 &&
                error.statusCode < 600) ||
            (error.name &&
                error.name.includes('Exception') &&
                typeof error.getStatus === 'function'));
    }
    handleDatabaseError(error, context) {
        if (this.isHttpException(error)) {
            throw error;
        }
        this.logger.error(`데이터베이스 에러 발생 [${context || 'Unknown'}]:`, {
            message: error.message,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint,
            table: error.table,
            column: error.column,
            stack: error.stack,
        });
        if (error.code && typeof error.code === 'string') {
            if (error.code.startsWith('DUPLICATE_')) {
                const ConflictException = require('@nestjs/common').ConflictException;
                throw new ConflictException(error.message);
            }
        }
        if (error.code) {
            switch (error.code) {
                case 'ECONNREFUSED':
                case 'ENOTFOUND':
                case 'ETIMEDOUT':
                case '08000':
                case '08003':
                case '08006':
                    return new DatabaseException(DatabaseErrorType.CONNECTION_ERROR, error, error.query, error.parameters);
                case '23000':
                case '23001':
                    return new DatabaseException(DatabaseErrorType.CONSTRAINT_VIOLATION, error, error.query, error.parameters);
                case '23503':
                    return new DatabaseException(DatabaseErrorType.FOREIGN_KEY_VIOLATION, error, error.query, error.parameters);
                case '23505':
                    return new DatabaseException(DatabaseErrorType.UNIQUE_VIOLATION, error, error.query, error.parameters);
                case '23502':
                    return new DatabaseException(DatabaseErrorType.NOT_NULL_VIOLATION, error, error.query, error.parameters);
                case '23514':
                    return new DatabaseException(DatabaseErrorType.CHECK_VIOLATION, error, error.query, error.parameters);
                case '40P01':
                    return new DatabaseException(DatabaseErrorType.DEADLOCK, error, error.query, error.parameters);
                case '40001':
                    return new DatabaseException(DatabaseErrorType.SERIALIZATION_FAILURE, error, error.query, error.parameters);
                case '57014':
                case '57P01':
                    return new DatabaseException(DatabaseErrorType.TIMEOUT, error, error.query, error.parameters);
            }
        }
        if (error instanceof typeorm_2.QueryFailedError) {
            return new DatabaseException(DatabaseErrorType.CONSTRAINT_VIOLATION, error, error.query, error.parameters);
        }
        return new DatabaseException(DatabaseErrorType.UNKNOWN_ERROR, error, error.query, error.parameters);
    }
    isRetryableError(error) {
        return [
            DatabaseErrorType.DEADLOCK,
            DatabaseErrorType.SERIALIZATION_FAILURE,
            DatabaseErrorType.CONNECTION_ERROR,
            DatabaseErrorType.TIMEOUT,
        ].includes(error.type);
    }
    async executeWithRetry(operation, maxRetries = 3, context = 'Transaction') {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                if (this.isHttpException(error)) {
                    throw error;
                }
                const dbError = this.handleDatabaseError(error, context);
                lastError = dbError;
                if (!this.isRetryableError(dbError) || attempt === maxRetries) {
                    throw dbError;
                }
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                this.logger.warn(`트랜잭션 재시도 ${attempt}/${maxRetries} (${delay}ms 대기): ${dbError.message}`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    async executeTransaction(operation, maxRetries = 3) {
        return this.executeWithRetry(async () => {
            const queryRunner = this.dataSource.createQueryRunner();
            try {
                await queryRunner.connect();
                await queryRunner.startTransaction();
                const result = await operation(queryRunner.manager);
                await queryRunner.commitTransaction();
                return result;
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                if (this.isHttpException(error)) {
                    throw error;
                }
                throw this.handleDatabaseError(error, '단일 트랜잭션');
            }
            finally {
                await queryRunner.release();
            }
        }, maxRetries, '단일 트랜잭션');
    }
    async executeNestedTransaction(operation, savepointName = `sp_${Date.now()}`, maxRetries = 3) {
        return this.executeWithRetry(async () => {
            const queryRunner = this.dataSource.createQueryRunner();
            try {
                await queryRunner.connect();
                await queryRunner.startTransaction();
                await queryRunner.query(`SAVEPOINT ${savepointName}`);
                const result = await operation(queryRunner.manager);
                await queryRunner.query(`RELEASE SAVEPOINT ${savepointName}`);
                await queryRunner.commitTransaction();
                this.logger.debug(`중첩 트랜잭션(${savepointName})이 성공적으로 완료되었습니다.`);
                return result;
            }
            catch (error) {
                await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                await queryRunner.rollbackTransaction();
                this.logger.debug(`중첩 트랜잭션(${savepointName})이 롤백되었습니다.`);
                throw this.handleDatabaseError(error, '중첩 트랜잭션');
            }
            finally {
                await queryRunner.release();
            }
        }, maxRetries, `중첩 트랜잭션(${savepointName})`);
    }
    async executeBatchTransaction(operations) {
        return this.executeTransaction(async (manager) => {
            const results = [];
            for (const operation of operations) {
                const result = await operation(manager);
                results.push(result);
            }
            return results;
        });
    }
    async executeTransactionWithDomainEvents(aggregates, operation) {
        return this.executeTransaction(async (manager) => {
            const result = await operation(manager);
            const domainEvents = [];
            aggregates.forEach((aggregate) => {
                domainEvents.push(...aggregate.getDomainEvents());
                aggregate.clearDomainEvents();
            });
            if (domainEvents.length > 0) {
                this.logger.debug(`${domainEvents.length}개의 도메인 이벤트를 처리합니다.`);
                await this.processDomainEvents(domainEvents, manager);
            }
            return result;
        });
    }
    async executeReadOnlyTransaction(operation, maxRetries = 2) {
        return this.executeWithRetry(async () => {
            const queryRunner = this.dataSource.createQueryRunner();
            try {
                await queryRunner.connect();
                await queryRunner.startTransaction('READ COMMITTED');
                await queryRunner.query('SET TRANSACTION READ ONLY');
                const result = await operation(queryRunner.manager);
                await queryRunner.commitTransaction();
                this.logger.debug('읽기 전용 트랜잭션이 성공적으로 완료되었습니다.');
                return result;
            }
            catch (error) {
                try {
                    await queryRunner.rollbackTransaction();
                    this.logger.debug('읽기 전용 트랜잭션이 롤백되었습니다.');
                }
                catch (rollbackError) {
                    this.logger.error('읽기 전용 트랜잭션 롤백 중 오류 발생:', rollbackError);
                }
                throw error;
            }
            finally {
                try {
                    await queryRunner.release();
                }
                catch (releaseError) {
                    this.logger.error('QueryRunner 해제 중 오류 발생:', releaseError);
                }
            }
        }, maxRetries, '읽기 전용 트랜잭션');
    }
    async executeTransactionWithIsolationLevel(isolationLevel, operation, maxRetries = isolationLevel === 'SERIALIZABLE' ? 5 : 3) {
        return this.executeWithRetry(async () => {
            const queryRunner = this.dataSource.createQueryRunner();
            try {
                await queryRunner.connect();
                await queryRunner.startTransaction(isolationLevel);
                const result = await operation(queryRunner.manager);
                await queryRunner.commitTransaction();
                this.logger.debug(`격리 수준 ${isolationLevel}로 트랜잭션이 완료되었습니다.`);
                return result;
            }
            catch (error) {
                try {
                    await queryRunner.rollbackTransaction();
                    this.logger.debug(`격리 수준 ${isolationLevel} 트랜잭션이 롤백되었습니다.`);
                }
                catch (rollbackError) {
                    this.logger.error(`격리 수준 ${isolationLevel} 트랜잭션 롤백 중 오류 발생:`, rollbackError);
                }
                throw error;
            }
            finally {
                try {
                    await queryRunner.release();
                }
                catch (releaseError) {
                    this.logger.error('QueryRunner 해제 중 오류 발생:', releaseError);
                }
            }
        }, maxRetries, `격리 수준 ${isolationLevel} 트랜잭션`);
    }
    getRepository(entityClass, defaultRepository, manager) {
        return manager ? manager.getRepository(entityClass) : defaultRepository;
    }
    registerDomainErrorHandler(domain) {
        this.logger.debug(`도메인 에러 핸들러 등록됨: ${domain}`);
    }
    createDomainContext(domain) {
        const errorHandler = this.errorHandlers.get(domain);
        return {
            executeSafeOperation: (operation, context) => {
                return this.executeSafeOperation(operation, context, errorHandler);
            },
        };
    }
    async executeDomainOperation(operation, context, domain) {
        const errorHandler = this.errorHandlers.get(domain);
        return this.executeSafeOperation(operation, context, errorHandler);
    }
    async executeSafeOperation(operation, context, errorHandler) {
        try {
            return await operation();
        }
        catch (error) {
            if (this.isHttpException(error)) {
                throw error;
            }
            const dbError = error instanceof DatabaseException
                ? error
                : this.handleDatabaseError(error, context);
            if (errorHandler) {
                const domainError = errorHandler(dbError);
                if (domainError) {
                    throw domainError;
                }
            }
            throw dbError;
        }
    }
    async processDomainEvents(events, manager) {
        for (const event of events) {
            this.logger.debug(`도메인 이벤트 처리: ${event.eventType}`, {
                eventId: event.eventId,
                aggregateId: event.aggregateId,
                occurredAt: event.occurredAt,
            });
        }
    }
};
exports.TransactionManagerService = TransactionManagerService;
exports.TransactionManagerService = TransactionManagerService = TransactionManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], TransactionManagerService);
//# sourceMappingURL=transaction-manager.service.js.map