import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ChangePasswordResult,
  CheckPasswordResult,
  DepartmentHierarchy,
  DepartmentInfo,
  DepartmentNode,
  EmployeeInfo,
  FCMTokenInfo,
  GetDepartmentHierarchyParams,
  GetEmployeeParams,
  GetEmployeesParams,
  GetFCMTokenParams,
  GetMultipleFCMTokensParams,
  LoginResult,
  MultipleFCMTokensInfo,
  RefreshTokenResult,
  SubscribeFCMParams,
  SubscribeFCMResult,
  UnsubscribeFCMParams,
  UnsubscribeFCMResult,
  VerifyTokenResult,
} from './interfaces';

/**
 * SSO 서비스
 * SSO SDK를 직접 사용하여 비즈니스 로직에서 사용하기 쉽게 한다
 */
@Injectable()
export class SSOService implements OnModuleInit {
  private readonly logger = new Logger(SSOService.name);
  private readonly sdkClient: any; // SDK 클라이언트 타입
  private readonly systemName: string;
  private initialized = false;

  constructor(
    @Inject('SSO_CONFIG') private readonly config: any,
    @Inject('SSO_SYSTEM_NAME') private readonly injectedSystemName: string,
  ) {
    this.systemName = injectedSystemName;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SSOClient: SDKSSOClientClass } = require('@lumir-company/sso-sdk');
    this.sdkClient = new SDKSSOClientClass({
      baseUrl: this.config.baseUrl,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      systemName: this.config.systemName || this.systemName,
      timeoutMs: this.config.timeoutMs,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
      enableLogging: this.config.enableLogging,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.초기화한다();
  }

  /**
   * 시스템 인증을 수행한다
   */
  async 초기화한다(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.sdkClient.initialize();
      this.initialized = true;
    } catch (error) {
      this.logger.error('SSO 클라이언트 초기화 실패:', error);
      throw error;
    }
  }

  private 초기화확인(): void {
    if (!this.initialized) {
      throw new Error(
        'SSO 클라이언트가 초기화되지 않았습니다. 먼저 초기화한다()를 호출하세요.',
      );
    }
  }

  // ========== 인증 관련 메서드 ==========

  /**
   * 사용자 로그인을 수행한다
   * 로그인 성공 후 시스템 역할을 검증하여 접근 권한을 확인한다
   *
   * @throws {ForbiddenException} 시스템 역할이 없거나 비어있는 경우
   */
  async 로그인한다(email: string, password: string): Promise<LoginResult> {
    this.초기화확인();
    let result: LoginResult;
    try {
      result = await this.sdkClient.sso.login(email, password);
      this.logger.log(`로그인 성공: ${email}`);
    } catch (error) {
      this.logger.error('로그인 실패', error);
      throw error;
    }
    this.logger.log(`로그인 결과: ${JSON.stringify(result)}`);
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
  }

  /**
   * 액세스 토큰을 검증한다
   * 토큰이 유효하지 않으면 UnauthorizedException을 발생시킨다
   *
   * @throws {UnauthorizedException} 토큰이 유효하지 않은 경우
   */
  async 토큰을검증한다(accessToken: string): Promise<VerifyTokenResult> {
    this.초기화확인();
    const result = await this.sdkClient.sso.verifyToken(accessToken);

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
    this.초기화확인();
    return this.sdkClient.sso.refreshToken(refreshToken);
  }

  /**
   * 현재 비밀번호를 확인한다
   */
  async 비밀번호를확인한다(
    accessToken: string,
    password: string,
    email: string,
  ): Promise<CheckPasswordResult> {
    this.초기화확인();
    return this.sdkClient.sso.checkPassword(accessToken, password, email);
  }

  /**
   * 비밀번호를 변경한다
   */
  async 비밀번호를변경한다(
    accessToken: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    this.초기화확인();
    return this.sdkClient.sso.changePassword(accessToken, newPassword);
  }

  // ========== 조직 정보 조회 메서드 ==========

  /**
   * 직원 정보를 조회한다
   */
  async 직원정보를조회한다(params: GetEmployeeParams): Promise<EmployeeInfo> {
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

  /**
   * 여러 직원의 정보를 조회한다
   */
  async 여러직원정보를조회한다(
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

  /**
   * 부서 계층구조를 조회한다
   */
  async 부서계층구조를조회한다(
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

      // 디버깅: 서버 원본 응답 구조 확인
      if (result.departments && result.departments.length > 0) {
        this.logger.debug(
          `서버 응답: 총 부서 수=${result.totalDepartments}, 루트 부서 수=${result.departments.length}`,
        );
        const firstDept = result.departments[0];
        this.logger.debug(
          `첫 번째 부서: children 배열 존재=${!!firstDept.children}, children 길이=${firstDept.children?.length || 0}`,
        );
        if (firstDept.children && firstDept.children.length > 0) {
          this.logger.debug(
            `첫 번째 부서의 자식 부서 예시: ${JSON.stringify(firstDept.children[0])}`,
          );
        }
      }

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

  // ========== FCM 토큰 관리 메서드 ==========

  /**
   * FCM 토큰을 구독한다 (앱 로그인 시)
   */
  async FCM토큰을구독한다(
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

  /**
   * FCM 토큰 구독을 해지한다 (앱 로그아웃 시)
   */
  async FCM토큰을구독해지한다(
    params: UnsubscribeFCMParams,
  ): Promise<UnsubscribeFCMResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.fcm.unsubscribe({
        employeeNumber: params.employeeNumber,
      });

      return {
        success: result.success || true,
        deletedCount: result.deletedCount || 0,
        message: result.message,
      };
    } catch (error) {
      this.logger.error('FCM 토큰 구독 해지 실패', error);
      throw error;
    }
  }

  /**
   * FCM 토큰을 조회한다
   */
  async FCM토큰을조회한다(params: GetFCMTokenParams): Promise<FCMTokenInfo> {
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

  /**
   * 여러 직원의 FCM 토큰을 조회한다 (알림 서버용)
   */
  async 여러직원의FCM토큰을조회한다(
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
  async 이메일로직원을조회한다(email: string): Promise<EmployeeInfo | null> {
    const employees = await this.여러직원정보를조회한다({
      withDetail: true,
    });
    return employees.find((emp) => emp.email === email) || null;
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

    return departments;
  }

  /**
   * SSO에서 모든 직원 정보를 평면 목록으로 조회한다
   * 부서 계층구조를 재귀적으로 순회하여 모든 부서의 직원 정보를 평면 목록으로 변환
   */
  async 모든직원정보를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<EmployeeInfo[]> {
    const hierarchy = await this.부서계층구조를조회한다({
      ...params,
      includeEmptyDepartments: true,
      withEmployeeDetail: true, // 직원 상세 정보 포함
    });

    const employees: EmployeeInfo[] = [];

    // 재귀적으로 부서 노드를 순회하여 직원 정보를 평면 목록으로 변환
    const flattenEmployees = (nodes: DepartmentNode[]): void => {
      for (const node of nodes) {
        // 현재 부서의 직원들을 추가
        if (node.employees && node.employees.length > 0) {
          employees.push(...node.employees);
        }

        // 하위 부서 재귀 호출
        if (node.children && node.children.length > 0) {
          flattenEmployees(node.children);
        }
      }
    };

    flattenEmployees(hierarchy.departments);

    return employees;
  }

  // ========== 헬퍼 메서드 ==========

  private mapToEmployeeInfo(data: any): EmployeeInfo {
    // 실제 SSO 데이터 구조에 맞게 매핑
    // status가 "재직중"이면 isTerminated는 false, 그 외는 true
    const isTerminated =
      data.status !== '재직중' &&
      data.status !== 'ACTIVE' &&
      data.status !== 'active';

    return {
      id: data.id,
      employeeNumber: data.employeeNumber,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber || undefined,
      isTerminated:
        data.isTerminated !== undefined ? data.isTerminated : isTerminated,
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
            positionName:
              data.position.positionTitle || data.position.positionName,
            positionLevel: data.position.level || data.position.positionLevel,
          }
        : undefined,
      jobTitle: data.rank
        ? {
            id: data.rank.id,
            jobTitleName: data.rank.rankName,
            jobTitleLevel: data.rank.level,
          }
        : data.jobTitle
          ? {
              id: data.jobTitle.id,
              jobTitleName: data.jobTitle.jobTitleName,
              jobTitleLevel: data.jobTitle.jobTitleLevel,
            }
          : undefined,
    };
  }

  private mapToDepartmentNode(data: any): DepartmentNode {
    // SSO SDK는 children 대신 childDepartments를 사용
    const childDepartments = data.childDepartments || data.children || [];

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
      children: Array.isArray(childDepartments)
        ? childDepartments.map((child) => this.mapToDepartmentNode(child))
        : [],
    };
  }
}
