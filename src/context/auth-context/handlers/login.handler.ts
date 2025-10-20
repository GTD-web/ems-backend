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
 * 2. 시스템 역할 검증 (EMS-PROD)
 * 3. Employee 정보 동기화 (생성/업데이트)
 * 4. 역할 정보 저장
 * 5. 사용자 정보 및 토큰 반환
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

    // 2. SSO에서 직원 상세 정보 조회
    const ssoEmployeeInfo = await this.ssoService.직원정보를조회한다({
      employeeNumber: loginResult.employeeNumber,
      withDetail: true,
    });

    // 3. Employee 동기화 (upsert with retry)
    let employee = await this.employeeService.findByEmployeeNumber(
      loginResult.employeeNumber,
    );

    const employeeData = {
      employeeNumber: ssoEmployeeInfo.employeeNumber,
      name: ssoEmployeeInfo.name,
      email: ssoEmployeeInfo.email,
      phoneNumber: ssoEmployeeInfo.phoneNumber,
      status: ssoEmployeeInfo.isTerminated ? '퇴사' : '재직중',
      departmentId: ssoEmployeeInfo.department?.id,
      departmentName: ssoEmployeeInfo.department?.departmentName,
      departmentCode: ssoEmployeeInfo.department?.departmentCode,
      positionId: ssoEmployeeInfo.position?.id,
      rankId: ssoEmployeeInfo.jobTitle?.id,
      rankName: ssoEmployeeInfo.jobTitle?.jobTitleName,
      rankLevel: ssoEmployeeInfo.jobTitle?.jobTitleLevel,
      externalId: ssoEmployeeInfo.id, // SSO 직원 ID (조직 정보)
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      lastSyncAt: new Date(),
    };

    // 부서 정보 로그 (디버깅용)
    this.logger.debug(
      `[로그인] SSO 부서 정보: departmentId="${employeeData.departmentId}", ` +
        `departmentName="${employeeData.departmentName}", ` +
        `departmentCode="${employeeData.departmentCode}"`,
    );

    if (employee) {
      // 업데이트
      await this.employeeService.update(employee.id, employeeData as any);
      this.logger.debug(`Employee 정보 업데이트: ${employee.employeeNumber}`);
    } else {
      // 생성 (중복 키 에러 처리)
      try {
        employee = await this.employeeService.create(employeeData as any);
        this.logger.log(`새 Employee 생성: ${employee.employeeNumber}`);
      } catch (error) {
        // 중복 키 에러인 경우 다시 조회 (race condition 처리)
        if (
          error?.code === '23505' ||
          error?.message?.includes('duplicate key')
        ) {
          this.logger.warn(
            `Employee 생성 중 중복 키 에러 발생, 재조회: ${loginResult.employeeNumber}`,
          );
          employee = await this.employeeService.findByEmployeeNumber(
            loginResult.employeeNumber,
          );

          // 재조회 후에도 없으면 예외 발생
          if (!employee) {
            throw new InternalServerErrorException(
              'Employee 동기화에 실패했습니다.',
            );
          }

          // 재조회된 경우 업데이트 시도
          await this.employeeService.update(employee.id, employeeData as any);
          this.logger.debug(
            `Employee 정보 업데이트 (재조회 후): ${employee.employeeNumber}`,
          );
        } else {
          // 다른 에러는 그대로 전파
          throw error;
        }
      }
    }

    // 4. 역할 정보 추출 (systemRoles['EMS-PROD'])
    const roles: string[] = loginResult.systemRoles?.['EMS-PROD'] || [];

    // 5. Employee에 역할 정보 저장
    if (roles.length > 0) {
      await this.employeeService.updateRoles(employee.id, roles);
      this.logger.debug(
        `역할 정보 업데이트: ${employee.employeeNumber}, roles: [${roles.join(', ')}]`,
      );
    }

    // 6. 최신 정보 재조회
    const updatedEmployee = await this.employeeService.findById(employee.id);

    if (!updatedEmployee) {
      throw new InternalServerErrorException('사용자 정보를 찾을 수 없습니다.');
    }

    // 7. 결과 반환
    const userInfo: AuthenticatedUserInfo = {
      id: updatedEmployee.id,
      externalId: updatedEmployee.externalId,
      email: updatedEmployee.email,
      name: updatedEmployee.name,
      employeeNumber: updatedEmployee.employeeNumber,
      roles: updatedEmployee['roles'] || roles,
      status: updatedEmployee.status,
    };

    return {
      user: userInfo,
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
    };
  }
}
