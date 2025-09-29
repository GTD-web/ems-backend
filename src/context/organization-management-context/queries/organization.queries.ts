import { IQuery } from '@nestjs/cqrs';

/**
 * 전체 부서 목록 조회 쿼리
 */
export class GetAllDepartmentsQuery implements IQuery {}

/**
 * 부서 정보 조회 쿼리
 */
export class GetDepartmentQuery implements IQuery {
  constructor(public readonly departmentId: string) {}
}

/**
 * 부서별 직원 목록 조회 쿼리
 */
export class GetEmployeesByDepartmentQuery implements IQuery {
  constructor(public readonly departmentId: string) {}
}

/**
 * 조직도 조회 쿼리
 */
export class GetOrganizationChartQuery implements IQuery {}

/**
 * 직원 정보 조회 쿼리
 */
export class GetEmployeeQuery implements IQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 전체 직원 목록 조회 쿼리
 */
export class GetAllEmployeesQuery implements IQuery {}

/**
 * 상급자 조회 쿼리
 */
export class GetManagerQuery implements IQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 하급자 목록 조회 쿼리
 */
export class GetSubordinatesQuery implements IQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 하위 부서 목록 조회 쿼리
 */
export class GetSubDepartmentsQuery implements IQuery {
  constructor(public readonly departmentId: string) {}
}

/**
 * 상위 부서 조회 쿼리
 */
export class GetParentDepartmentQuery implements IQuery {
  constructor(public readonly departmentId: string) {}
}

/**
 * 활성 직원 목록 조회 쿼리
 */
export class GetActiveEmployeesQuery implements IQuery {}
