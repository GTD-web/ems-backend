import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * E2E 테스트 베이스 클래스
 * 모든 E2E 테스트에서 상속받아 사용
 */
export class BaseE2ETest {
  public app: INestApplication;
  protected dataSource: DataSource;

  /**
   * 테스트 애플리케이션 초기화
   */
  async initializeApp(): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();

    // ValidationPipe 설정 (실제 애플리케이션과 동일하게)
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    this.dataSource = moduleFixture.get<DataSource>(DataSource);

    await this.app.init();
  }

  /**
   * 테스트 애플리케이션 종료
   */
  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * 모든 테이블 데이터 초기화 (TRUNCATE)
   */
  private async cleanDatabase(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      return;
    }

    const entities = this.dataSource.entityMetadatas;

    // PostgreSQL의 경우 CASCADE를 사용하여 외래키 제약조건 무시
    try {
      // 모든 테이블 TRUNCATE
      for (const entity of entities) {
        const tableName = entity.tableName;
        await this.dataSource.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
        );
      }
    } catch (error) {
      console.warn('테이블 정리 중 오류 발생:', error);
      // 실패 시 개별 테이블 삭제 시도
      for (const entity of entities) {
        try {
          const repository = this.dataSource.getRepository(entity.name);
          await repository.clear();
        } catch (e) {
          console.warn(`테이블 ${entity.name} 정리 실패:`, e);
        }
      }
    }
  }

  /**
   * 특정 테이블들만 초기화
   */
  private async cleanTables(tableNames: string[]): Promise<void> {
    if (!this.dataSource.isInitialized) {
      return;
    }

    try {
      for (const tableName of tableNames) {
        await this.dataSource.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
        );
      }
    } catch (error) {
      console.warn('특정 테이블 정리 중 오류 발생:', error);
    }
  }

  /**
   * 트랜잭션 시작
   */
  private async startTransaction(): Promise<void> {
    await this.dataSource.query('START TRANSACTION');
  }

  /**
   * 트랜잭션 롤백
   */
  private async rollbackTransaction(): Promise<void> {
    await this.dataSource.query('ROLLBACK');
  }

  /**
   * 시퀀스 초기화 (PostgreSQL)
   */
  private async resetSequences(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;

    for (const entity of entities) {
      const tableName = entity.tableName;
      try {
        // PostgreSQL의 경우 시퀀스 초기화
        await this.dataSource.query(
          `ALTER SEQUENCE IF EXISTS "${tableName}_id_seq" RESTART WITH 1`,
        );
      } catch (error) {
        // 시퀀스가 없는 테이블은 무시
        console.warn(`시퀀스 초기화 실패 (${tableName}):`, error.message);
      }
    }
  }

  /**
   * 각 테스트 전 데이터베이스 정리
   */
  async cleanupBeforeTest(): Promise<void> {
    await this.cleanDatabase();
  }

  /**
   * 각 테스트 후 데이터베이스 정리
   */
  async cleanupAfterTest(): Promise<void> {
    await this.cleanDatabase();
  }

  /**
   * 트랜잭션 기반 테스트 시작
   */
  async startTransactionTest(): Promise<void> {
    await this.startTransaction();
  }

  /**
   * 트랜잭션 기반 테스트 종료 (롤백)
   */
  async rollbackTransactionTest(): Promise<void> {
    await this.rollbackTransaction();
  }

  /**
   * 특정 테이블들만 정리
   */
  async cleanupSpecificTables(tableNames: string[]): Promise<void> {
    await this.cleanTables(tableNames);
  }

  /**
   * 시퀀스 초기화
   */
  async resetDatabaseSequences(): Promise<void> {
    await this.resetSequences();
  }

  /**
   * 테스트 데이터 시드
   */
  async seedTestData(): Promise<any> {
    // 필요한 경우 기본 테스트 데이터 삽입
    // 예: 기본 사용자, 기본 설정 등
    return {};
  }
}
