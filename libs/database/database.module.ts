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
        const isDevelopment = nodeEnv === 'development';

        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        // SSL 필요 여부 판단 (환경변수로 명시적 설정)
        const needsSSL =
          configService.get<string>('DATABASE_SSL', 'false') === 'true';

        // URL 형식 검증 및 파싱 (postgresql:// 또는 postgres://로 시작하는지 확인)
        const urlPattern =
          /^(postgresql|postgres):\/\/([^:@]+)(?::([^@]+))?@([^:/]+)(?::(\d+))?\/([^?]+)(?:\?(.+))?$/;
        const match = databaseUrl.match(urlPattern);

        if (match) {
          // URL 형식이 유효하면 개별 파라미터로 변환
          const [, , username, password, host, port, database] = match;

          return {
            type: 'postgres',
            host,
            port: port ? parseInt(port, 10) : 5432,
            username,
            password: password || '',
            database: database.split('?')[0],
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
        }

        // URL 형식이 아니면 기존 방식 사용
        return {
          type: 'postgres',
          url: databaseUrl,
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
