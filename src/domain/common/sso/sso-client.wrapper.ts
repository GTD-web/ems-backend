import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { SSOClient as SDKSSOClient } from '@lumir-company/sso-sdk';
import type {
  ISSOClient,
  ISSOAuthService,
  ISSOOrganizationService,
  ISSOfcmService,
  SSOClientConfig,
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
 * SSO SDK 클라이언트를 래핑하는 구현체
 * 외부 SDK 의존성을 격리하고 도메인 인터페이스를 제공한다
 */
@Injectable()
export class SSOClientWrapper implements ISSOClient {
  private readonly logger = new Logger(SSOClientWrapper.name);
  private sdkClient: any; // SDK 클라이언트 타입
  private initialized = false;

  constructor(config: SSOClientConfig) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SSOClient: SDKSSOClientClass } = require('@lumir-company/sso-sdk');
    this.sdkClient = new SDKSSOClientClass({
      baseUrl: config.baseUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      systemName: config.systemName,
      timeoutMs: config.timeoutMs,
      retries: config.retries,
      retryDelay: config.retryDelay,
      enableLogging: config.enableLogging,
    });
  }

  /**
   * 시스템 인증을 수행한다
   */
  async 초기화한다(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('SSO 클라이언트가 이미 초기화되었습니다.');
      return;
    }

    try {
      await this.sdkClient.initialize();
      this.initialized = true;
      this.logger.log('SSO 클라이언트 초기화 완료');
    } catch (error) {
      this.logger.error('SSO 클라이언트 초기화 실패', error);
      throw error;
    }
  }

  /**
   * 인증 관련 서비스
   */
  get auth(): ISSOAuthService {
    return {
      로그인한다: this.로그인한다.bind(this),
      토큰을검증한다: this.토큰을검증한다.bind(this),
      토큰을갱신한다: this.토큰을갱신한다.bind(this),
      비밀번호를확인한다: this.비밀번호를확인한다.bind(this),
      비밀번호를변경한다: this.비밀번호를변경한다.bind(this),
    };
  }

  /**
   * 조직 정보 조회 서비스
   */
  get organization(): ISSOOrganizationService {
    return {
      직원정보를조회한다: this.직원정보를조회한다.bind(this),
      여러직원정보를조회한다: this.여러직원정보를조회한다.bind(this),
      부서계층구조를조회한다: this.부서계층구조를조회한다.bind(this),
    };
  }

  /**
   * FCM 토큰 관리 서비스
   */
  get fcm(): ISSOfcmService {
    return {
      FCM토큰을구독한다: this.FCM토큰을구독한다.bind(this),
      FCM토큰을구독해지한다: this.FCM토큰을구독해지한다.bind(this),
      FCM토큰을조회한다: this.FCM토큰을조회한다.bind(this),
      여러직원의FCM토큰을조회한다: this.여러직원의FCM토큰을조회한다.bind(this),
    };
  }

  // ========== Auth 메서드 구현 ==========

  private async 로그인한다(
    email: string,
    password: string,
  ): Promise<LoginResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.sso.login(email, password);
      return {
        id: result.id,
        email: result.email,
        name: result.name,
        employeeNumber: result.employeeNumber,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        systemRoles: result.systemRoles, // 시스템별 역할 정보
      };
    } catch (error) {
      this.logger.error('로그인 실패', error);
      throw error;
    }
  }

  private async 토큰을검증한다(
    accessToken: string,
  ): Promise<VerifyTokenResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.sso.verifyToken(accessToken);

      // SDK 응답 구조: { valid, user_info: { id, name, email, employee_number }, expires_in }
      const userInfo = result.user_info || {};

      return {
        valid: result.valid,
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        employeeNumber: userInfo.employee_number, // snake_case를 camelCase로 변환
      };
    } catch (error) {
      this.logger.error('토큰 검증 실패', error);
      throw error;
    }
  }

  private async 토큰을갱신한다(
    refreshToken: string,
  ): Promise<RefreshTokenResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.sso.refreshToken(refreshToken);
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      this.logger.error('토큰 갱신 실패', error);
      throw error;
    }
  }

  private async 비밀번호를확인한다(
    accessToken: string,
    password: string,
    email: string,
  ): Promise<CheckPasswordResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.sso.checkPassword(
        accessToken,
        password,
        email,
      );
      return {
        valid: result.valid,
        message: result.message,
      };
    } catch (error) {
      this.logger.error('비밀번호 확인 실패', error);
      throw error;
    }
  }

  private async 비밀번호를변경한다(
    accessToken: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.sso.changePassword(
        accessToken,
        newPassword,
      );
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      this.logger.error('비밀번호 변경 실패', error);
      throw error;
    }
  }

  // ========== Organization 메서드 구현 ==========

  private async 직원정보를조회한다(
    params: GetEmployeeParams,
  ): Promise<EmployeeInfo> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.organization.getEmployee({
        employeeNumber: params.employeeNumber,
        employeeId: params.employeeId,
        withDetail: params.withDetail,
      });
      return this.mapToEmployeeInfo(result);
    } catch (error) {
      this.logger.error('직원 정보 조회 실패', error);
      throw error;
    }
  }

  private async 여러직원정보를조회한다(
    params: GetEmployeesParams,
  ): Promise<EmployeeInfo[]> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.organization.getEmployees({
        identifiers: params.identifiers,
        withDetail: params.withDetail,
        includeTerminated: params.includeTerminated,
      });

      // SDK 응답이 배열인지 확인
      const employees = Array.isArray(result)
        ? result
        : result?.employees || result?.data || [];

      if (!Array.isArray(employees)) {
        this.logger.warn(
          '예상치 못한 응답 형식:',
          JSON.stringify(result).substring(0, 200),
        );
        return [];
      }

      return employees.map((emp) => this.mapToEmployeeInfo(emp));
    } catch (error) {
      this.logger.error('여러 직원 정보 조회 실패', error);
      throw error;
    }
  }

  private async 부서계층구조를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<DepartmentHierarchy> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.organization.getDepartmentHierarchy({
        rootDepartmentId: params?.rootDepartmentId,
        maxDepth: params?.maxDepth,
        withEmployeeDetail: params?.withEmployeeDetail,
        includeEmptyDepartments: params?.includeEmptyDepartments,
      });
      return {
        departments: result.departments.map((dept) =>
          this.mapToDepartmentNode(dept),
        ),
        totalDepartments: result.totalDepartments,
        totalEmployees: result.totalEmployees,
      };
    } catch (error) {
      this.logger.error('부서 계층구조 조회 실패', error);
      throw error;
    }
  }

  // ========== FCM 메서드 구현 ==========

  private async FCM토큰을구독한다(
    params: SubscribeFCMParams,
  ): Promise<SubscribeFCMResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.fcm.subscribe({
        employeeNumber: params.employeeNumber,
        fcmToken: params.fcmToken,
        deviceType: params.deviceType,
      });
      return {
        success: true,
        fcmToken: result.fcmToken,
        employeeNumber: result.employeeNumber,
        deviceType: result.deviceType,
      };
    } catch (error) {
      this.logger.error('FCM 토큰 구독 실패', error);
      throw error;
    }
  }

  private async FCM토큰을구독해지한다(
    params: UnsubscribeFCMParams,
  ): Promise<UnsubscribeFCMResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.fcm.unsubscribe({
        employeeNumber: params.employeeNumber,
      });
      return {
        success: result.success,
        deletedCount: result.deletedCount || 0,
        message: result.message,
      };
    } catch (error) {
      this.logger.error('FCM 토큰 구독 해지 실패', error);
      throw error;
    }
  }

  private async FCM토큰을조회한다(
    params: GetFCMTokenParams,
  ): Promise<FCMTokenInfo> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.fcm.getToken({
        employeeNumber: params.employeeNumber,
      });
      return {
        employeeNumber: result.employeeNumber,
        tokens: result.tokens.map((token) => ({
          fcmToken: token.fcmToken,
          deviceType: token.deviceType,
          createdAt: new Date(token.createdAt),
        })),
      };
    } catch (error) {
      this.logger.error('FCM 토큰 조회 실패', error);
      throw error;
    }
  }

  private async 여러직원의FCM토큰을조회한다(
    params: GetMultipleFCMTokensParams,
  ): Promise<MultipleFCMTokensInfo> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.fcm.getMultipleTokens({
        employeeNumbers: params.employeeNumbers,
      });
      return {
        totalEmployees: result.totalEmployees,
        totalTokens: result.totalTokens,
        byEmployee: result.byEmployee.map((emp) => ({
          employeeNumber: emp.employeeNumber,
          tokens: emp.tokens.map((token) => ({
            fcmToken: token.fcmToken,
            deviceType: token.deviceType,
            createdAt: new Date(token.createdAt),
          })),
        })),
        allTokens: result.allTokens.map((token) => ({
          fcmToken: token.fcmToken,
          deviceType: token.deviceType,
          createdAt: new Date(token.createdAt),
        })),
      };
    } catch (error) {
      this.logger.error('여러 직원의 FCM 토큰 조회 실패', error);
      throw error;
    }
  }

  // ========== 헬퍼 메서드 ==========

  private 초기화확인(): void {
    if (!this.initialized) {
      throw new Error(
        'SSO 클라이언트가 초기화되지 않았습니다. 먼저 초기화한다()를 호출하세요.',
      );
    }
  }

  private mapToEmployeeInfo(data: any): EmployeeInfo {
    return {
      id: data.id,
      employeeNumber: data.employeeNumber,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      isTerminated: data.isTerminated,
      department: data.department
        ? {
            id: data.department.id,
            departmentCode: data.department.departmentCode,
            departmentName: data.department.departmentName,
            parentDepartmentId: data.department.parentDepartmentId,
          }
        : undefined,
      position: data.position
        ? {
            id: data.position.id,
            positionName: data.position.positionName,
            positionLevel: data.position.positionLevel,
          }
        : undefined,
      jobTitle: data.jobTitle
        ? {
            id: data.jobTitle.id,
            jobTitleName: data.jobTitle.jobTitleName,
            jobTitleLevel: data.jobTitle.jobTitleLevel,
          }
        : undefined,
    };
  }

  private mapToDepartmentNode(data: any): any {
    return {
      id: data.id,
      departmentCode: data.departmentCode,
      departmentName: data.departmentName,
      parentDepartmentId: data.parentDepartmentId,
      depth: data.depth,
      employeeCount: data.employeeCount,
      employees: Array.isArray(data.employees)
        ? data.employees.map((emp) => this.mapToEmployeeInfo(emp))
        : [],
      children: Array.isArray(data.children)
        ? data.children.map((child) => this.mapToDepartmentNode(child))
        : [],
    };
  }
}
