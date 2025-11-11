"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const common_1 = require("@nestjs/common");
class BaseRepository {
    dataSource;
    entityTarget;
    logger = new common_1.Logger(this.constructor.name);
    repository;
    constructor(dataSource, entityTarget) {
        this.dataSource = dataSource;
        this.entityTarget = entityTarget;
        this.repository = this.dataSource.getRepository(entityTarget);
    }
    async findById(id) {
        try {
            const entity = await this.repository.findOne({
                where: { id },
            });
            return entity || null;
        }
        catch (error) {
            this.logger.error(`엔티티 조회 실패 (ID: ${id}):`, error);
            throw error;
        }
    }
    async findOne(options) {
        try {
            const entity = await this.repository.findOne(options);
            return entity || null;
        }
        catch (error) {
            this.logger.error('엔티티 조회 실패:', error);
            throw error;
        }
    }
    async findMany(options) {
        try {
            return await this.repository.find(options);
        }
        catch (error) {
            this.logger.error('엔티티 목록 조회 실패:', error);
            throw error;
        }
    }
    async count(options) {
        try {
            return await this.repository.count(options);
        }
        catch (error) {
            this.logger.error('엔티티 개수 조회 실패:', error);
            throw error;
        }
    }
    async exists(options) {
        try {
            const count = await this.repository.count({ where: options });
            return count > 0;
        }
        catch (error) {
            this.logger.error('엔티티 존재 여부 확인 실패:', error);
            throw error;
        }
    }
    async save(entity) {
        try {
            return await this.repository.save(entity);
        }
        catch (error) {
            this.logger.error('엔티티 저장 실패:', error);
            throw error;
        }
    }
    async saveMany(entities) {
        try {
            return await this.repository.save(entities);
        }
        catch (error) {
            this.logger.error('엔티티 목록 저장 실패:', error);
            throw error;
        }
    }
    async delete(id) {
        try {
            await this.repository.delete(id);
        }
        catch (error) {
            this.logger.error(`엔티티 삭제 실패 (ID: ${id}):`, error);
            throw error;
        }
    }
    async deleteMany(criteria) {
        try {
            await this.repository.delete(criteria);
        }
        catch (error) {
            this.logger.error('엔티티 목록 삭제 실패:', error);
            throw error;
        }
    }
    async softDelete(id) {
        try {
            await this.repository.softDelete(id);
        }
        catch (error) {
            this.logger.error(`엔티티 소프트 삭제 실패 (ID: ${id}):`, error);
            throw error;
        }
    }
    async restore(id) {
        try {
            await this.repository.restore(id);
        }
        catch (error) {
            this.logger.error(`엔티티 복구 실패 (ID: ${id}):`, error);
            throw error;
        }
    }
    async runInTransaction(operation) {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();
            const transactionalRepository = queryRunner.manager.getRepository(this.entityTarget);
            const result = await operation(transactionalRepository);
            await queryRunner.commitTransaction();
            return result;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('트랜잭션 실행 실패:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    createQueryBuilder(alias) {
        return this.repository.createQueryBuilder(alias);
    }
    getRepository() {
        return this.repository;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map