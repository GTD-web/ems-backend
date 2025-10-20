/**
 * SSO 조직 정보 조회 서비스 인터페이스
 */
export interface ISSOOrganizationService {
  /**
   * 직원 정보를 조회한다
   * @param params 조회 파라미터
   * @returns 직원 정보
   */
  직원정보를조회한다(params: GetEmployeeParams): Promise<EmployeeInfo>;

  /**
   * 여러 직원의 정보를 조회한다
   * @param params 조회 파라미터
   * @returns 직원 정보 배열
   */
  여러직원정보를조회한다(params: GetEmployeesParams): Promise<EmployeeInfo[]>;

  /**
   * 부서 계층구조를 조회한다
   * @param params 조회 파라미터
   * @returns 부서 계층구조
   */
  부서계층구조를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<DepartmentHierarchy>;
}

/**
 * 직원 조회 파라미터
 */
export interface GetEmployeeParams {
  /** 사번 */
  employeeNumber?: string;
  /** 직원 ID */
  employeeId?: string;
  /** 상세 정보 포함 여부 (부서, 직책, 직급) */
  withDetail?: boolean;
}

/**
 * 여러 직원 조회 파라미터
 */
export interface GetEmployeesParams {
  /** 사번 또는 ID 배열 (생략 시 전체 조회) */
  identifiers?: string[];
  /** 상세 정보 포함 여부 */
  withDetail?: boolean;
  /** 퇴사자 포함 여부 */
  includeTerminated?: boolean;
}

/**
 * 부서 계층구조 조회 파라미터
 */
export interface GetDepartmentHierarchyParams {
  /** 루트 부서 ID (생략 시 전체) */
  rootDepartmentId?: string;
  /** 최대 깊이 */
  maxDepth?: number;
  /** 직원 상세 정보 포함 여부 */
  withEmployeeDetail?: boolean;
  /** 빈 부서 포함 여부 */
  includeEmptyDepartments?: boolean;
}

/**
 * 직원 정보
 */
export interface EmployeeInfo {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phoneNumber?: string;
  isTerminated: boolean;
  department?: DepartmentInfo;
  position?: PositionInfo;
  jobTitle?: JobTitleInfo;
}

/**
 * 부서 정보
 */
export interface DepartmentInfo {
  id: string;
  departmentCode: string;
  departmentName: string;
  parentDepartmentId?: string;
}

/**
 * 직책 정보
 */
export interface PositionInfo {
  id: string;
  positionName: string;
  positionLevel: number;
}

/**
 * 직급 정보
 */
export interface JobTitleInfo {
  id: string;
  jobTitleName: string;
  jobTitleLevel: number;
}

/**
 * 부서 계층구조
 */
export interface DepartmentHierarchy {
  departments: DepartmentNode[];
  totalDepartments: number;
  totalEmployees: number;
}

/**
 * 부서 노드
 */
export interface DepartmentNode {
  id: string;
  departmentCode: string;
  departmentName: string;
  parentDepartmentId?: string;
  depth: number;
  employeeCount: number;
  employees: EmployeeInfo[];
  children: DepartmentNode[];
}
