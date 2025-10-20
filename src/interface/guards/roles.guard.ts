import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RBAC 역할 검증 가드
 *
 * @Roles() 데코레이터로 지정된 역할을 검증합니다.
 * EMS-PROD 시스템 역할 배열에 하나라도 매칭되면 통과합니다.
 *
 * 주의: JwtAuthGuard 이후에 실행되어야 합니다.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin', 'manager')
 * @Get('users')
 * getUsers() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Roles() 데코레이터에서 필요한 역할 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // @Roles() 데코레이터가 없으면 통과
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    // 사용자 정보가 없으면 (JwtAuthGuard를 거치지 않았으면) 에러
    if (!user) {
      this.logger.error(
        '사용자 정보가 없습니다. JwtAuthGuard가 먼저 실행되어야 합니다.',
      );
      throw new ForbiddenException('인증 정보가 없습니다.');
    }

    // 사용자의 역할 확인
    const userRoles = user.roles || [];

    // 필요한 역할 중 하나라도 사용자가 가지고 있는지 확인
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `접근 거부: 사용자 ${user.email}은(는) 필요한 역할이 없습니다. ` +
          `필요 역할: [${requiredRoles.join(', ')}], ` +
          `보유 역할: [${userRoles.join(', ')}]`,
      );
      throw new ForbiddenException(
        `이 작업을 수행할 권한이 없습니다. 필요한 역할: ${requiredRoles.join(', ')}`,
      );
    }

    this.logger.debug(
      `역할 검증 통과: 사용자 ${user.email}, 역할: [${userRoles.join(', ')}]`,
    );

    return true;
  }
}
