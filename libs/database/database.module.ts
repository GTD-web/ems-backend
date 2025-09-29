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

        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: configService.get<boolean>(
            'DB_SYNCHRONIZE',
            nodeEnv === 'development',
          ),
          logging: configService.get<boolean>(
            'DB_LOGGING',
            nodeEnv === 'development',
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
