import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * 데이터베이스 서비스
 *
 * 데이터베이스 연결 관리, 트랜잭션 처리, 헬스체크 등의 기능을 제공합니다.
 * DDD Repository 패턴을 지원하는 기본 인프라를 제공합니다.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.checkConnection();
  }

  async onModuleDestroy() {
    await this.closeConnection();
  }

  /**
   * 데이터베이스 연결 상태 확인
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      // 간단한 쿼리로 연결 테스트
      await this.dataSource.query('SELECT 1');

      this.logger.log('데이터베이스 연결이 성공적으로 설정되었습니다.');
      this.logger.log(`데이터베이스: ${this.dataSource.options.database}`);

      // PostgreSQL 연결 옵션으로 타입 캐스팅
      const pgOptions = this.dataSource.options as any;
      if (pgOptions.host && pgOptions.port) {
        this.logger.log(`호스트: ${pgOptions.host}:${pgOptions.port}`);
      }

      return true;
    } catch (error) {
      this.logger.error('데이터베이스 연결에 실패했습니다:', error);
      return false;
    }
  }

  /**
   * 데이터베이스 연결 종료
   */
  async closeConnection(): Promise<void> {
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        this.logger.log('데이터베이스 연결이 정상적으로 종료되었습니다.');
      }
    } catch (error) {
      this.logger.error(
        '데이터베이스 연결 종료 중 오류가 발생했습니다:',
        error,
      );
    }
  }

  /**
   * 헬스체크 - 데이터베이스 상태 확인
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: string;
    connection: boolean;
    responseTime?: number;
  }> {
    const startTime = Date.now();

    try {
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        database: this.dataSource.options.database as string,
        connection: true,
        responseTime,
      };
    } catch (error) {
      this.logger.error('데이터베이스 헬스체크 실패:', error);

      return {
        status: 'unhealthy',
        database: this.dataSource.options.database as string,
        connection: false,
      };
    }
  }

  /**
   * 데이터베이스 통계 정보 조회
   */
  async getDatabaseStats(): Promise<{
    totalConnections: number;
    activeConnections: number;
    databaseSize: string;
    version: string;
  }> {
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
    } catch (error) {
      this.logger.error('데이터베이스 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 마이그레이션 실행
   */
  async runMigrations(): Promise<void> {
    try {
      await this.dataSource.runMigrations();
      this.logger.log('마이그레이션이 성공적으로 실행되었습니다.');
    } catch (error) {
      this.logger.error('마이그레이션 실행 실패:', error);
      throw error;
    }
  }

  /**
   * 마이그레이션 되돌리기
   */
  async revertMigrations(): Promise<void> {
    try {
      await this.dataSource.undoLastMigration();
      this.logger.log('마이그레이션이 성공적으로 되돌려졌습니다.');
    } catch (error) {
      this.logger.error('마이그레이션 되돌리기 실패:', error);
      throw error;
    }
  }
}
