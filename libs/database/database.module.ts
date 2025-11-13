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
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isTest = nodeEnv === 'test';
        const isDevelopment = nodeEnv === 'development';

        // 개별 환경 변수로 데이터베이스 연결 정보 가져오기
        const dbHost = configService.get<string>('DATABASE_HOST');
        const dbPort = configService.get<number>('DATABASE_PORT', 5432);
        const dbUsername = configService.get<string>('DATABASE_USERNAME');
        const dbPassword = configService.get<string>('DATABASE_PASSWORD', '');
        const dbName = configService.get<string>('DATABASE_NAME');

        // 필수 환경 변수 검증
        if (!dbHost || !dbUsername || !dbName) {
          throw new Error(
            '데이터베이스 연결 정보가 누락되었습니다. ' +
            'DATABASE_HOST, DATABASE_USERNAME, DATABASE_NAME 환경 변수를 설정해주세요.',
          );
        }

        const host = dbHost;
        const port = dbPort;
        const username = dbUsername;
        const password = dbPassword;
        const database = dbName;

        // SSL 필요 여부 판단 (환경변수로 명시적 설정)
        const needsSSL =
          configService.get<string>('DATABASE_SSL', 'false') === 'true';

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          autoLoadEntities: true,
          dropSchema: isTest,
          synchronize: configService.get<boolean>(
            'DB_SYNCHRONIZE',
            isDevelopment || isTest,
          ),
          logging: configService.get<boolean>(
            'DB_LOGGING',
            isDevelopment && !isTest,
          ),
          ssl: needsSSL ? { rejectUnauthorized: false } : false,
          extra: {
            max: 10,
            connectionTimeoutMillis: 60000,
            idleTimeoutMillis: 30000,
            ...(needsSSL && { ssl: { rejectUnauthorized: false } }),
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
