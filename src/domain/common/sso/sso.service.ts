import {
  Injectable,
  Inject,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { ISSOClient } from './interfaces';
import {
  LoginResult,
  VerifyTokenResult,
  RefreshTokenResult,
  CheckPasswordResult,
  ChangePasswordResult,
  GetEmployeeParams,
  GetEmployeesParams,
  GetDepartmentHierarchyParams,
  EmployeeInfo,
  DepartmentHierarchy,
  DepartmentInfo,
  DepartmentNode,
  SubscribeFCMParams,
  SubscribeFCMResult,
  UnsubscribeFCMParams,
  UnsubscribeFCMResult,
  GetFCMTokenParams,
  FCMTokenInfo,
  GetMultipleFCMTokensParams,
  MultipleFCMTokensInfo,
} from './interfaces';

/**
 * SSO 서비스
 * SSO 클라이언트를 파사드 패턴으로 래핑하여 비즈니스 로직에서 사용하기 쉽게 한다
 */
@Injectable()
export class SSOService {
  private readonly logger = new Logger(SSOService.name);

  constructor(
    @Inject('SSO_CLIENT') private readonly ssoClient: ISSOClient,
    @Inject('SSO_SYSTEM_NAME') private readonly systemName: string,
  ) {
    this.logger.log(`SSO 시스템 이름: ${this.systemName}`);
  }

  // ========== 인증 관련 메서드 ==========

  /**
   * 사용자 로그인을 수행한다
   * 로그인 성공 후 시스템 역할을 검증하여 접근 권한을 확인한다
   *
   * @throws {ForbiddenException} 시스템 역할이 없거나 비어있는 경우
   */
  async 로그인한다(email: string, password: string): Promise<LoginResult> {
    const result = await this.ssoClient.auth.로그인한다(email, password);

    // 시스템 역할 검증
    this.시스템역할을검증한다(result);

    return result;
  }

  /**
   * 시스템 역할을 검증한다
   * systemRoles에 설정된 시스템(기본: EMS-PROD)의 역할이 없거나 비어있으면 예외를 발생시킨다
   *
   * @param loginResult 로그인 결과
   * @throws {ForbiddenException} 시스템 역할이 없거나 비어있는 경우
   */
  private 시스템역할을검증한다(loginResult: LoginResult): void {
    const systemRoles = loginResult.systemRoles;

    // systemRoles가 없는 경우
    if (!systemRoles) {
      this.logger.warn(
        `사용자 ${loginResult.email}의 systemRoles가 존재하지 않습니다.`,
      );
      throw new ForbiddenException(
        `이 시스템(${this.systemName})에 대한 접근 권한이 없습니다.`,
      );
    }

    // 시스템별 역할 배열 가져오기
    const roles = systemRoles[this.systemName];

    // 시스템 역할이 없거나 빈 배열인 경우
    if (!roles || roles.length === 0) {
      this.logger.warn(
        `사용자 ${loginResult.email}에게 ${this.systemName} 시스템 역할이 없습니다. ` +
          `보유 시스템: ${Object.keys(systemRoles).join(', ')}`,
      );
      throw new ForbiddenException(
        `이 시스템(${this.systemName})에 대한 접근 권한이 없습니다. ` +
          `시스템 관리자에게 문의하세요.`,
      );
    }

    this.logger.log(
      `사용자 ${loginResult.email}의 ${this.systemName} 역할: ${roles.join(', ')}`,
    );
  }

  /**
   * 액세스 토큰을 검증한다
   * 토큰이 유효하지 않으면 UnauthorizedException을 발생시킨다
   *
   * @throws {UnauthorizedException} 토큰이 유효하지 않은 경우
   */
  async 토큰을검증한다(accessToken: string): Promise<VerifyTokenResult> {
    const result = await this.ssoClient.auth.토큰을검증한다(accessToken);

    // valid가 false인 경우 예외 발생
    if (!result.valid) {
      this.logger.warn('유효하지 않은 토큰 검증 시도');
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    return result;
  }

  /**
   * 리프레시 토큰으로 액세스 토큰을 갱신한다
   */
  async 토큰을갱신한다(refreshToken: string): Promise<RefreshTokenResult> {
    return this.ssoClient.auth.토큰을갱신한다(refreshToken);
  }

  /**
   * 현재 비밀번호를 확인한다
   */
  async 비밀번호를확인한다(
    accessToken: string,
    password: string,
    email: string,
  ): Promise<CheckPasswordResult> {
    return this.ssoClient.auth.비밀번호를확인한다(accessToken, password, email);
  }

  /**
   * 비밀번호를 변경한다
   */
  async 비밀번호를변경한다(
    accessToken: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    return this.ssoClient.auth.비밀번호를변경한다(accessToken, newPassword);
  }

  // ========== 조직 정보 조회 메서드 ==========

  /**
   * 직원 정보를 조회한다
   */
  async 직원정보를조회한다(params: GetEmployeeParams): Promise<EmployeeInfo> {
    return this.ssoClient.organization.직원정보를조회한다(params);
  }

  /**
   * 여러 직원의 정보를 조회한다
   */
  async 여러직원정보를조회한다(
    params: GetEmployeesParams,
  ): Promise<any[]> {
    return this.ssoClient.organization.여러직원정보를조회한다(params);
  }

  /**
   * 부서 계층구조를 조회한다
   */
  async 부서계층구조를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<DepartmentHierarchy> {
    return this.ssoClient.organization.부서계층구조를조회한다(params);
  }

  // ========== FCM 토큰 관리 메서드 ==========

  /**
   * FCM 토큰을 구독한다 (앱 로그인 시)
   */
  async FCM토큰을구독한다(
    params: SubscribeFCMParams,
  ): Promise<SubscribeFCMResult> {
    return this.ssoClient.fcm.FCM토큰을구독한다(params);
  }

  /**
   * FCM 토큰 구독을 해지한다 (앱 로그아웃 시)
   */
  async FCM토큰을구독해지한다(
    params: UnsubscribeFCMParams,
  ): Promise<UnsubscribeFCMResult> {
    return this.ssoClient.fcm.FCM토큰을구독해지한다(params);
  }

  /**
   * FCM 토큰을 조회한다
   */
  async FCM토큰을조회한다(params: GetFCMTokenParams): Promise<FCMTokenInfo> {
    return this.ssoClient.fcm.FCM토큰을조회한다(params);
  }

  /**
   * 여러 직원의 FCM 토큰을 조회한다 (알림 서버용)
   */
  async 여러직원의FCM토큰을조회한다(
    params: GetMultipleFCMTokensParams,
  ): Promise<MultipleFCMTokensInfo> {
    return this.ssoClient.fcm.여러직원의FCM토큰을조회한다(params);
  }

  // ========== 편의 메서드 ==========

  /**
   * 사번으로 직원 정보를 조회한다 (상세 정보 포함)
   */
  async 사번으로직원을조회한다(employeeNumber: string): Promise<EmployeeInfo> {
    return this.직원정보를조회한다({
      employeeNumber,
      withDetail: true,
    });
  }

  /**
   * 이메일로 직원 정보를 조회한다
   * 전체 직원 목록을 가져온 후 이메일로 필터링
   */
  async 이메일로직원을조회한다(email: string): Promise<any | null> {
    const employees = await this.여러직원정보를조회한다({
      withDetail: true,
    });
    return employees.find((emp) => emp.email === email) || null;
  }

  /**
   * 여러 사번으로 직원 정보를 조회한다
   */
  async 여러사번으로직원을조회한다(
    employeeNumbers: string[],
  ): Promise<any[]> {
    return this.여러직원정보를조회한다({
      identifiers: employeeNumbers,
      withDetail: true,
      includeTerminated: false,
    });
  }

  /**
   * SSO에서 모든 부서 정보를 평면 목록으로 조회한다
   * 부서 계층구조를 재귀적으로 순회하여 평면 목록으로 변환
   */
  async 모든부서정보를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<DepartmentInfo[]> {
    const hierarchy = await this.부서계층구조를조회한다({
      ...params,
      includeEmptyDepartments: true,
      withEmployeeDetail: false,
    });

    const departments: DepartmentInfo[] = [];

    // 재귀적으로 부서 노드를 평면 목록으로 변환
    const flattenDepartments = (nodes: DepartmentNode[]): void => {
      for (const node of nodes) {
        departments.push({
          id: node.id,
          departmentCode: node.departmentCode,
          departmentName: node.departmentName,
          parentDepartmentId: node.parentDepartmentId,
        });

        if (node.children && node.children.length > 0) {
          flattenDepartments(node.children);
        }
      }
    };

    flattenDepartments(hierarchy.departments);

    this.logger.log(
      `SSO에서 ${departments.length}개의 부서 데이터를 조회했습니다.`,
    );

    return departments;
  }

  /**
   * SSO에서 모든 직원 정보를 평면 목록으로 조회한다
   * 부서 계층구조를 재귀적으로 순회하여 모든 부서의 직원 정보를 평면 목록으로 변환
   */
  async 모든직원정보를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<any[]> {
    const hierarchy = await this.부서계층구조를조회한다({
      ...params,
      includeEmptyDepartments: true,
      withEmployeeDetail: true, // 직원 상세 정보 포함
    });

    this.logger.log(
      `부서 계층구조 조회 완료: 총 부서 ${hierarchy.totalDepartments}개, 총 직원 ${hierarchy.totalEmployees}개`,
    );

    const employees: any[] = [];

    // 재귀적으로 부서 노드를 순회하여 직원 정보를 평면 목록으로 변환
    const flattenEmployees = (
      nodes: DepartmentNode[],
      depth: number = 0,
    ): void => {
      for (const node of nodes) {
        const indent = '  '.repeat(depth);
        this.logger.debug(
          `${indent}부서: ${node.departmentName} (${node.departmentCode}) - 직원 수: ${node.employees?.length || 0}`,
        );

        // 현재 부서의 직원들을 추가
        if (node.employees && node.employees.length > 0) {
          this.logger.debug(
            `${indent}  → ${node.employees.length}명의 직원 추가: ${node.employees.map((e) => e.name).join(', ')}`,
          );
          employees.push(...node.employees);
        }

        // 하위 부서 재귀 호출
        if (node.children && node.children.length > 0) {
          this.logger.debug(
            `${indent}  하위 부서 ${node.children.length}개 재귀 호출`,
          );
          flattenEmployees(node.children, depth + 1);
        }
      }
    };

    flattenEmployees(hierarchy.departments);

    this.logger.log(
      `SSO에서 ${employees.length}개의 직원 데이터를 조회했습니다. (부서 계층구조 총 직원 수: ${hierarchy.totalEmployees})`,
    );

    // 총 직원 수와 실제 수집된 직원 수가 다른 경우 경고
    if (hierarchy.totalEmployees > 0 && employees.length !== hierarchy.totalEmployees) {
      this.logger.warn(
        `경고: 부서 계층구조의 총 직원 수(${hierarchy.totalEmployees})와 실제 수집된 직원 수(${employees.length})가 다릅니다.`,
      );
    }

    return employees;
  }
}
