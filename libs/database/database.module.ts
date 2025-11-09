import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionManagerService } from './transaction-manager.service';

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
        const isVercel = !!process.env.VERCEL;
        const isProduction = nodeEnv === 'production';

        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        // SSL 설정: 프로덕션 환경 또는 Vercel 환경에서 SSL 활성화
        // DATABASE_URL에 sslmode 파라미터가 있으면 자동으로 SSL이 필요함
        const needsSSL =
          isProduction ||
          isVercel ||
          databaseUrl.includes('sslmode=require') ||
          databaseUrl.includes('sslmode=prefer');

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
          // SSL 설정: 자체 서명 인증서를 허용
          ssl: needsSSL ? { rejectUnauthorized: false } : false,
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
