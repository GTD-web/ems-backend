import { SetMetadata } from '@nestjs/common';

/**
 * Public 데코레이터 메타데이터 키
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public 데코레이터
 *
 * JWT 인증을 건너뛰는 엔드포인트에 사용합니다.
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
