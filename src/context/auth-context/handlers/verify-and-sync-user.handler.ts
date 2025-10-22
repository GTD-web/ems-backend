import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { SSOService } from '@domain/common/sso';
import { EmployeeService } from '@domain/common/employee/employee.service';
import {
  VerifyAndSyncUserCommand,
  VerifyAndSyncUserResult,
  AuthenticatedUserInfo,
} from '../interfaces/auth-context.interface';

/**
 * 토큰 검증 및 사용자 조회 핸들러
 *
 * 1. SSO 서버에 토큰 검증
 * 2. Employee 정보 조회
 * 3. 사용자 정보 반환
 */
@Injectable()
export class VerifyAndSyncUserHandler {
  private readonly logger = new Logger(VerifyAndSyncUserHandler.name);

  constructor(
    private readonly ssoService: SSOService,
    private readonly employeeService: EmployeeService,
  ) {}

  async execute(
    command: VerifyAndSyncUserCommand,
  ): Promise<VerifyAndSyncUserResult> {
    const { accessToken } = command;

    try {
      // 1. 토큰 검증 (valid: false이면 UnauthorizedException 발생)
      const verifyResult = await this.ssoService.토큰을검증한다(accessToken);

      // 2. Employee 정보 조회 (시스템에 등록된 직원만 인증 허용)
      const employee = await this.employeeService.findByEmployeeNumber(
        verifyResult.employeeNumber!,
      );

      if (!employee) {
        this.logger.warn(
          `시스템에 등록되지 않은 직원의 토큰 검증 시도: ${verifyResult.employeeNumber}`,
        );
        throw new UnauthorizedException(
          '시스템에 등록되지 않은 사용자입니다. 관리자에게 문의하세요.',
        );
      }

      // 3. 결과 반환
      const userInfo: AuthenticatedUserInfo = {
        id: employee.id,
        externalId: employee.externalId,
        email: employee.email,
        name: employee.name,
        employeeNumber: employee.employeeNumber,
        roles: employee['roles'] || [],
        status: employee.status,
      };

      return {
        user: userInfo,
        isSynced: false, // 더 이상 동기화하지 않음
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('토큰 검증 실패:', error);
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
  }
}
