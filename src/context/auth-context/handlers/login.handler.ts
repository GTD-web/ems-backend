import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { SSOService } from '@domain/common/sso';
import { EmployeeService } from '@domain/common/employee/employee.service';
import {
  LoginCommand,
  LoginResult,
  AuthenticatedUserInfo,
} from '../interfaces/auth-context.interface';

/**
 * 로그인 핸들러
 *
 * 1. SSO 서버에 로그인 (이메일, 패스워드)
 * 2. Employee 존재 여부 확인 (없으면 로그인 거부)
 * 3. 사용자 정보 및 토큰 반환
 */
@Injectable()
export class LoginHandler {
  private readonly logger = new Logger(LoginHandler.name);

  constructor(
    private readonly ssoService: SSOService,
    private readonly employeeService: EmployeeService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const { email, password } = command;

    // 1. SSO 로그인 (시스템 역할 자동 검증됨)
    // 외부 API 호출 에러만 변환
    let loginResult;
    try {
      loginResult = await this.ssoService.로그인한다(email, password);
    } catch (error) {
      // ForbiddenException은 그대로 전파 (EMS-PROD 역할 검증 실패)
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // SSO SDK 에러를 적절한 HTTP 예외로 변환
      if (error?.code) {
        switch (error.code) {
          case 'NOT_FOUND':
          case 'AUTHENTICATION_FAILED':
          case 'INVALID_CREDENTIALS':
            // 사용자에게는 구체적인 에러를 노출하지 않음 (보안)
            throw new UnauthorizedException(
              '이메일 또는 패스워드가 올바르지 않습니다.',
            );

          case 'FORBIDDEN':
            throw new ForbiddenException(
              '이 시스템에 대한 접근 권한이 없습니다.',
            );

          default:
            this.logger.error(`예상치 못한 SSO 에러: ${error.code}`, error);
            throw new InternalServerErrorException(
              '로그인 처리 중 오류가 발생했습니다.',
            );
        }
      }

      // 기타 예외
      throw new InternalServerErrorException(
        '로그인 처리 중 오류가 발생했습니다.',
      );
    }

    this.logger.log(
      `로그인 성공: ${loginResult.email} (${loginResult.employeeNumber})`,
    );

    // 2. Employee 조회 (시스템에 등록된 직원만 로그인 가능)
    const employee = await this.employeeService.findByEmployeeNumber(
      loginResult.employeeNumber,
    );

    // Employee가 없으면 로그인 거부
    if (!employee) {
      this.logger.warn(
        `시스템에 등록되지 않은 직원의 로그인 시도: ${loginResult.employeeNumber} (${loginResult.email})`,
      );
      throw new ForbiddenException(
        '시스템에 등록되지 않은 사용자입니다. 관리자에게 문의하세요.',
      );
    }

    // 3. 역할 정보 추출 (systemRoles['EMS-PROD'])
    const roles: string[] = loginResult.systemRoles?.['EMS-PROD'] || [];
    this.logger.log(
      `로그인 결과의 systemRoles: ${JSON.stringify(loginResult.systemRoles)}`,
    );
    this.logger.log(`추출된 roles: [${roles.join(', ')}]`);

    // 4. 결과 반환 (역할 정보는 업데이트하지 않음)
    const userInfo: AuthenticatedUserInfo = {
      id: employee.id,
      externalId: employee.externalId,
      email: employee.email,
      name: employee.name,
      employeeNumber: employee.employeeNumber,
      roles: employee['roles'] || roles,
      status: employee.status,
    };

    return {
      user: userInfo,
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
    };
  }
}
