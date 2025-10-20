import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { SSOService } from '@domain/common/sso';
import { EmployeeService } from '@domain/common/employee/employee.service';
import {
  VerifyAndSyncUserCommand,
  VerifyAndSyncUserResult,
  AuthenticatedUserInfo,
} from '../interfaces/auth-context.interface';

/**
 * 토큰 검증 및 사용자 동기화 핸들러
 *
 * 1. SSO 서버에 토큰 검증
 * 2. Employee 정보 동기화 (생성/업데이트)
 * 3. 역할 정보 업데이트
 * 4. 최신 사용자 정보 반환
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

      // 2. SSO에서 직원 상세 정보 조회
      const ssoEmployeeInfo = await this.ssoService.직원정보를조회한다({
        employeeNumber: verifyResult.employeeNumber!,
        withDetail: true,
      });

      // 3. Employee 동기화 (upsert)
      let employee = await this.employeeService.findByEmployeeNumber(
        verifyResult.employeeNumber!,
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
        externalId: verifyResult.id!,
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        lastSyncAt: new Date(),
      };

      let isSynced = false;

      if (employee) {
        // 업데이트
        await this.employeeService.update(employee.id, employeeData as any);
        this.logger.debug(`Employee 정보 업데이트: ${employee.employeeNumber}`);
        isSynced = true;
      } else {
        // 생성
        employee = await this.employeeService.create(employeeData as any);
        this.logger.log(`새 Employee 생성: ${employee.employeeNumber}`);
        isSynced = true;
      }

      // 4. 역할 정보 추출 (systemRoles['EMS-PROD'])
      const roles: string[] = [];
      if (ssoEmployeeInfo['systemRoles']?.['EMS-PROD']) {
        roles.push(...ssoEmployeeInfo['systemRoles']['EMS-PROD']);
      }

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
        throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
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
        isSynced,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('토큰 검증 및 사용자 동기화 실패:', error);
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
  }
}
