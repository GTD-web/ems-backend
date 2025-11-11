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
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    dataSource;
    logger = new common_1.Logger(DatabaseService_1.name);
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        await this.checkConnection();
    }
    async onModuleDestroy() {
        await this.closeConnection();
    }
    async checkConnection() {
        try {
            if (!this.dataSource.isInitialized) {
                await this.dataSource.initialize();
            }
            await this.dataSource.query('SELECT 1');
            this.logger.log('데이터베이스 연결이 성공적으로 설정되었습니다.');
            this.logger.log(`데이터베이스: ${this.dataSource.options.database}`);
            const pgOptions = this.dataSource.options;
            if (pgOptions.host && pgOptions.port) {
                this.logger.log(`호스트: ${pgOptions.host}:${pgOptions.port}`);
            }
            return true;
        }
        catch (error) {
            this.logger.error('데이터베이스 연결에 실패했습니다:', error);
            return false;
        }
    }
    async closeConnection() {
        try {
            if (this.dataSource.isInitialized) {
                await this.dataSource.destroy();
                this.logger.log('데이터베이스 연결이 정상적으로 종료되었습니다.');
            }
        }
        catch (error) {
            this.logger.error('데이터베이스 연결 종료 중 오류가 발생했습니다:', error);
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.dataSource.query('SELECT 1');
            const responseTime = Date.now() - startTime;
            return {
                status: 'healthy',
                database: this.dataSource.options.database,
                connection: true,
                responseTime,
            };
        }
        catch (error) {
            this.logger.error('데이터베이스 헬스체크 실패:', error);
            return {
                status: 'unhealthy',
                database: this.dataSource.options.database,
                connection: false,
            };
        }
    }
    async getDatabaseStats() {
        try {
            const [connectionStats, sizeStats, versionStats] = await Promise.all([
                this.dataSource.query(`
          SELECT count(*) as total_connections,
                 count(*) FILTER (WHERE state = 'active') as active_connections
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `),
                this.dataSource.query(`
          SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
        `),
                this.dataSource.query('SELECT version() as version'),
            ]);
            return {
                totalConnections: parseInt(connectionStats[0].total_connections),
                activeConnections: parseInt(connectionStats[0].active_connections),
                databaseSize: sizeStats[0].database_size,
                version: versionStats[0].version,
            };
        }
        catch (error) {
            this.logger.error('데이터베이스 통계 조회 실패:', error);
            throw error;
        }
    }
    async runMigrations() {
        try {
            await this.dataSource.runMigrations();
            this.logger.log('마이그레이션이 성공적으로 실행되었습니다.');
        }
        catch (error) {
            this.logger.error('마이그레이션 실행 실패:', error);
            throw error;
        }
    }
    async revertMigrations() {
        try {
            await this.dataSource.undoLastMigration();
            this.logger.log('마이그레이션이 성공적으로 되돌려졌습니다.');
        }
        catch (error) {
            this.logger.error('마이그레이션 되돌리기 실패:', error);
            throw error;
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], DatabaseService);
//# sourceMappingURL=database.service.js.map