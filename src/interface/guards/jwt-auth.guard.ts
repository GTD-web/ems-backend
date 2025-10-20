import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '@context/auth-context';
import { IS_PUBLIC_KEY } from '../decorators';

/**
 * JWT 인증 가드
 *
 * Auth Context를 통해 토큰을 검증하고 사용자 정보를 동기화합니다.
 * 검증 시마다 Employee 정보와 역할을 최신으로 업데이트합니다.
 * @Public() 데코레이터가 있는 엔드포인트는 인증을 건너뜁니다.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있는지 확인
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    try {
      // Auth Context를 통해 토큰 검증 및 Employee 동기화
      // 이 과정에서 SSO 서버 검증, Employee 생성/업데이트, 역할 동기화가 모두 수행됨
      const result = await this.authService.토큰검증및사용자동기화(token);

      // 검증된 사용자 정보를 Request에 주입
      request['user'] = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        employeeNumber: result.user.employeeNumber,
        roles: result.user.roles, // EMS-PROD 시스템 역할
      };

      if (result.isSynced) {
        this.logger.debug(
          `사용자 정보 동기화 완료: ${result.user.employeeNumber}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('토큰 검증 중 오류 발생:', error);
      throw new UnauthorizedException('토큰 검증에 실패했습니다.');
    }
  }

  /**
   * Authorization 헤더에서 Bearer 토큰을 추출합니다
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}

// Request 객체에 user 속성을 추가하기 위한 타입 확장
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      employeeNumber: string;
      roles: string[]; // EMS-PROD 시스템 역할
    };
  }
}

// @CurrentUser 데코레이터 사용을 위한 타입 정의
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  employeeNumber: string;
  roles: string[]; // EMS-PROD 시스템 역할
}
