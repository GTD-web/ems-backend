import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionManagerService } from './transaction-manager.service';
import { config } from 'dotenv';

// 환경 변수 로드
config();
/**
 * 데이터베이스 모듈
 *
 * TypeORM을 사용하여 PostgreSQL 데이터베이스 연결을 관리합니다.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isTest = nodeEnv === 'test';

        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          // 테스트 환경에서는 기존 스키마를 드롭하고 새로 생성
          dropSchema: isTest,
          synchronize: configService.get<boolean>(
            'DB_SYNCHRONIZE',
            nodeEnv === 'development' || isTest,
          ),
          logging: configService.get<boolean>(
            'DB_LOGGING',
            nodeEnv === 'development' && !isTest,
          ),
          ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
          // 연결 풀 설정 (개발 환경에서 안정성 향상)
          extra: {
            connectionLimit: 10,
            acquireTimeout: 60000,
            timeout: 60000,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [TransactionManagerService],
  exports: [TransactionManagerService, TypeOrmModule],
})
export class DatabaseModule {}
