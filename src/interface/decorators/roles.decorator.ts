import { SetMetadata } from '@nestjs/common';

/**
 * RBAC 역할 데코레이터
 * EMS-PROD 시스템의 역할을 검증합니다.
 *
 * @param roles - 허용할 역할 목록 (하나라도 매칭되면 통과)
 *
 * @example
 * ```typescript
 * @Roles('admin')  // admin 역할만 허용
 * @Get('users')
 * getUsers() { ... }
 *
 * @Roles('admin', 'manager')  // admin 또는 manager 역할 허용
 * @Post('users')
 * createUser() { ... }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * 역할 메타데이터 키
 */
export const ROLES_KEY = 'roles';
