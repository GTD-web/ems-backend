import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SSOClientWrapper } from './sso-client.wrapper';
import { SSOService } from './sso.service';
import { ISSOClient, SSOClientConfig } from './interfaces';

/**
 * SSO 모듈
 * SSO SDK를 NestJS에 통합하여 제공한다
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SSO_CONFIG',
      useFactory: (configService: ConfigService): SSOClientConfig => {
        const config: SSOClientConfig = {
          baseUrl:
            configService.get<string>('SSO_BASE_URL') ||
            'https://lsso.vercel.app',
          clientId: configService.get<string>('SSO_CLIENT_ID') || '',
          clientSecret: configService.get<string>('SSO_CLIENT_SECRET') || '',
          timeoutMs: configService.get<number>('SSO_TIMEOUT_MS') || 10000,
          retries: configService.get<number>('SSO_RETRIES') || 3,
          retryDelay: configService.get<number>('SSO_RETRY_DELAY') || 200,
          enableLogging:
            configService.get<string>('SSO_ENABLE_LOGGING') === 'true',
        };

        // 필수 설정 검증
        if (!config.clientId || !config.clientSecret) {
          throw new Error(
            'SSO_CLIENT_ID와 SSO_CLIENT_SECRET 환경 변수가 필요합니다.',
          );
        }

        return config;
      },
      inject: [ConfigService],
    },
    {
      provide: 'SSO_SYSTEM_NAME',
      useFactory: (configService: ConfigService): string => {
        return configService.get<string>('SSO_SYSTEM_NAME') || 'EMS-PROD';
      },
      inject: [ConfigService],
    },
    {
      provide: 'SSO_CLIENT',
      useFactory: async (config: SSOClientConfig): Promise<ISSOClient> => {
        const client = new SSOClientWrapper(config);
        await client.초기화한다();
        return client;
      },
      inject: ['SSO_CONFIG'],
    },
    SSOService,
  ],
  exports: ['SSO_CLIENT', 'SSO_CONFIG', 'SSO_SYSTEM_NAME', SSOService],
})
export class SSOModule {}
