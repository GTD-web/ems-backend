import { Injectable } from '@nestjs/common';
import { VerifyAndSyncUserHandler } from './handlers/verify-and-sync-user.handler';
import { GetUserWithRolesHandler } from './handlers/get-user-with-roles.handler';
import {
  VerifyAndSyncUserCommand,
  VerifyAndSyncUserResult,
  GetUserWithRolesQuery,
  GetUserWithRolesResult,
} from './interfaces/auth-context.interface';

/**
 * 인증 컨텍스트 서비스
 *
 * 인증 및 사용자 정보 관리를 담당합니다.
 * CQRS 패턴을 적용하여 Command/Query를 분리합니다.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly verifyAndSyncUserHandler: VerifyAndSyncUserHandler,
    private readonly getUserWithRolesHandler: GetUserWithRolesHandler,
  ) {}

  /**
   * 토큰 검증 및 사용자 정보 동기화
   *
   * @param accessToken - JWT 액세스 토큰
   * @returns 인증된 사용자 정보 및 동기화 여부
   */
  async 토큰검증및사용자동기화(
    accessToken: string,
  ): Promise<VerifyAndSyncUserResult> {
    const command: VerifyAndSyncUserCommand = { accessToken };
    return this.verifyAndSyncUserHandler.execute(command);
  }

  /**
   * 역할 포함 사용자 조회
   *
   * @param employeeNumber - 직원 번호
   * @returns 사용자 정보 및 역할
   */
  async 역할포함사용자조회(
    employeeNumber: string,
  ): Promise<GetUserWithRolesResult> {
    const query: GetUserWithRolesQuery = { employeeNumber };
    return this.getUserWithRolesHandler.execute(query);
  }
}
