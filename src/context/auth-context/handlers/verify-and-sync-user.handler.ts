import {
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { SSOService } from '@domain/common/sso';
import type { ISSOService } from '@domain/common/sso/interfaces';
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
    @Inject(SSOService) private readonly ssoService: ISSOService,
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
      const requestedEmployeeNumber = verifyResult.user_info.employee_number;
      const employee = await this.employeeService.findByEmployeeNumber(
        requestedEmployeeNumber,
      );

      if (!employee) {
        this.logger.warn(
          `시스템에 등록되지 않은 직원의 토큰 검증 시도: ${requestedEmployeeNumber}`,
        );
        throw new UnauthorizedException(
          '시스템에 등록되지 않은 사용자입니다. 관리자에게 문의하세요.',
        );
      }

      // 3. 사번 일치 검증 (대소문자, 공백 등 고려)
      if (employee.employeeNumber !== requestedEmployeeNumber) {
        this.logger.warn(
          `사번 불일치: 요청된 사번(${requestedEmployeeNumber})과 조회된 사번(${employee.employeeNumber})이 일치하지 않습니다.`,
        );
        throw new UnauthorizedException(
          '사용자 정보가 일치하지 않습니다. 관리자에게 문의하세요.',
        );
      }

      // 4. 결과 반환
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
      this.logger.error('토큰 검증 실패:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('토큰 검증 실패:', error);
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
  }
}
