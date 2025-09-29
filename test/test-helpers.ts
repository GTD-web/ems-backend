import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * 통합 테스트를 위한 애플리케이션 생성 헬퍼
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [],
      }),
      AppModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const dataSource = moduleFixture.get<DataSource>(DataSource);

  return { app, module: moduleFixture, dataSource };
}

/**
 * 데이터베이스 정리 헬퍼
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
}

/**
 * 테스트 데이터 생성을 위한 기본 값들
 */
export const TEST_CONSTANTS = {
  USER_ID: 'test-user-123',
  EVALUATION_PERIOD: {
    name: '2024년 상반기 평가',
    description: '2024년 상반기 인사평가 기간',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    evaluationSetupDeadline: new Date('2024-01-15'),
    performanceDeadline: new Date('2024-06-15'),
    selfEvaluationDeadline: new Date('2024-06-25'),
    peerEvaluationDeadline: new Date('2024-06-30'),
    gradeRanges: [
      { grade: 'S', score: 97, minRange: 95, maxRange: 100 },
      { grade: 'A', score: 89, minRange: 85, maxRange: 94 },
      { grade: 'B', score: 79, minRange: 75, maxRange: 84 },
      { grade: 'C', score: 69, minRange: 65, maxRange: 74 },
      { grade: 'F', score: 32, minRange: 0, maxRange: 64 },
    ],
  },
} as const;
