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

      // 2. Employee 정보 조회 또는 생성
      const requestedEmployeeNumber = verifyResult.user_info.employee_number;
      let employee = await this.employeeService.findByEmployeeNumber(
        requestedEmployeeNumber,
      );

      // Employee가 없으면 기본 정보로 자동 생성
      if (!employee) {
        this.logger.log(
          `시스템에 등록되지 않은 직원 발견. 기본 정보로 자동 생성합니다: ${requestedEmployeeNumber}`,
        );

        try {
          // 토큰 검증 결과의 기본 정보로 Employee 생성
          employee = await this.employeeService.create({
            employeeNumber: requestedEmployeeNumber,
            name: verifyResult.user_info.name,
            email: verifyResult.user_info.email,
            externalId: verifyResult.user_info.id,
            status: '재직중', // 기본값
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
            lastSyncAt: new Date(),
            isExcludedFromList: false,
            isAccessible: true, // 자동 생성 시 접근 가능하도록 설정
          });

          this.logger.log(
            `직원 자동 생성 완료: ${employee.employeeNumber} (${employee.name})`,
          );
        } catch (error) {
          this.logger.error(
            `직원 자동 생성 실패: ${requestedEmployeeNumber}`,
            error,
          );
          throw new UnauthorizedException(
            '직원 정보 생성 중 오류가 발생했습니다. 관리자에게 문의하세요.',
          );
        }
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
