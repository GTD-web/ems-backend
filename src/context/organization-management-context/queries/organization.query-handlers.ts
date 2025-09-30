import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from '../../../domain/common/department/department.repository';
import { EmployeeRepository } from '../../../domain/common/employee/employee.repository';
import type { DepartmentDto } from '../../../domain/common/department/department.types';
import type {
  EmployeeDto,
  EmployeeStatus,
} from '../../../domain/common/employee/employee.types';
import type {
  OrganizationChartDto,
  DepartmentWithEmployeesDto,
} from '../interfaces/organization-management-context.interface';
import {
  GetAllDepartmentsQuery,
  GetDepartmentQuery,
  GetEmployeesByDepartmentQuery,
  GetOrganizationChartQuery,
  GetEmployeeQuery,
  GetAllEmployeesQuery,
  GetManagerQuery,
  GetSubordinatesQuery,
  GetSubDepartmentsQuery,
  GetParentDepartmentQuery,
  GetActiveEmployeesQuery,
} from './organization.queries';

/**
 * 전체 부서 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetAllDepartmentsQuery)
@Injectable()
export class GetAllDepartmentsQueryHandler
  implements IQueryHandler<GetAllDepartmentsQuery>
{
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(query: GetAllDepartmentsQuery): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.findAll();
    return departments.map((dept) => dept.DTO로_변환한다());
  }
}

/**
 * 부서 정보 조회 쿼리 핸들러
 */
@QueryHandler(GetDepartmentQuery)
@Injectable()
export class GetDepartmentQueryHandler
  implements IQueryHandler<GetDepartmentQuery>
{
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(query: GetDepartmentQuery): Promise<DepartmentDto | null> {
    const { departmentId } = query;
    const department = await this.departmentRepository.findById(departmentId);
    return department ? department.DTO로_변환한다() : null;
  }
}

/**
 * 부서별 직원 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetEmployeesByDepartmentQuery)
@Injectable()
export class GetEmployeesByDepartmentQueryHandler
  implements IQueryHandler<GetEmployeesByDepartmentQuery>
{
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetEmployeesByDepartmentQuery): Promise<EmployeeDto[]> {
    const { departmentId } = query;
    const employees =
      await this.employeeRepository.findByDepartmentId(departmentId);
    return employees.map((emp) => emp.DTO로_변환한다());
  }
}

/**
 * 조직도 조회 쿼리 핸들러
 */
@QueryHandler(GetOrganizationChartQuery)
@Injectable()
export class GetOrganizationChartQueryHandler
  implements IQueryHandler<GetOrganizationChartQuery>
{
  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(
    query: GetOrganizationChartQuery,
  ): Promise<OrganizationChartDto> {
    const allDepartments = await this.departmentRepository.findAll();
    const allEmployees = await this.employeeRepository.findAll();

    // 부서별로 직원들을 그룹화
    const employeesByDept = allEmployees.reduce(
      (acc, emp) => {
        const deptId = emp.departmentId || 'unassigned';
        if (!acc[deptId]) acc[deptId] = [];
        acc[deptId].push(emp.DTO로_변환한다());
        return acc;
      },
      {} as Record<string, EmployeeDto[]>,
    );

    // 부서 계층 구조 구성
    const departmentMap = new Map<string, DepartmentWithEmployeesDto>();
    const rootDepartments: DepartmentWithEmployeesDto[] = [];

    // 모든 부서를 맵에 추가
    allDepartments.forEach((dept) => {
      const deptDto = dept.DTO로_변환한다();
      const deptWithEmployees: DepartmentWithEmployeesDto = {
        ...deptDto,
        employees: employeesByDept[dept.id] || [],
        subDepartments: [],
      };
      departmentMap.set(dept.id, deptWithEmployees);
    });

    // 부서 계층 구조 구성
    allDepartments.forEach((dept) => {
      const deptWithEmployees = departmentMap.get(dept.id)!;
      if (dept.parentDepartmentId) {
        const parent = departmentMap.get(dept.parentDepartmentId);
        if (parent) {
          parent.subDepartments.push(deptWithEmployees);
        } else {
          rootDepartments.push(deptWithEmployees);
        }
      } else {
        rootDepartments.push(deptWithEmployees);
      }
    });

    return {
      departments: rootDepartments,
      totalEmployeeCount: allEmployees.length,
      lastUpdatedAt: new Date(),
    };
  }
}

/**
 * 직원 정보 조회 쿼리 핸들러
 */
@QueryHandler(GetEmployeeQuery)
@Injectable()
export class GetEmployeeQueryHandler
  implements IQueryHandler<GetEmployeeQuery>
{
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetEmployeeQuery): Promise<EmployeeDto | null> {
    const { employeeId } = query;
    const employee = await this.employeeRepository.findById(employeeId);
    return employee ? employee.DTO로_변환한다() : null;
  }
}

/**
 * 전체 직원 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetAllEmployeesQuery)
@Injectable()
export class GetAllEmployeesQueryHandler
  implements IQueryHandler<GetAllEmployeesQuery>
{
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetAllEmployeesQuery): Promise<EmployeeDto[]> {
    const employees = await this.employeeRepository.findAll();
    return employees.map((emp) => emp.DTO로_변환한다());
  }
}

/**
 * 상급자 조회 쿼리 핸들러
 */
@QueryHandler(GetManagerQuery)
@Injectable()
export class GetManagerQueryHandler implements IQueryHandler<GetManagerQuery> {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetManagerQuery): Promise<EmployeeDto | null> {
    const { employeeId } = query;
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee || !employee.managerId) {
      return null;
    }

    const manager = await this.employeeRepository.findById(employee.managerId);
    return manager ? manager.DTO로_변환한다() : null;
  }
}

/**
 * 하급자 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetSubordinatesQuery)
@Injectable()
export class GetSubordinatesQueryHandler
  implements IQueryHandler<GetSubordinatesQuery>
{
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetSubordinatesQuery): Promise<EmployeeDto[]> {
    const { employeeId } = query;
    // findByManagerId가 없으므로 필터를 사용하여 매니저 ID로 검색
    const subordinates = await this.employeeRepository.findByFilter({
      managerId: employeeId,
    });
    return subordinates.map((emp) => emp.DTO로_변환한다());
  }
}

/**
 * 하위 부서 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetSubDepartmentsQuery)
@Injectable()
export class GetSubDepartmentsQueryHandler
  implements IQueryHandler<GetSubDepartmentsQuery>
{
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(query: GetSubDepartmentsQuery): Promise<DepartmentDto[]> {
    const { departmentId } = query;
    const subDepartments =
      await this.departmentRepository.findByParentDepartmentId(departmentId);
    return subDepartments.map((dept) => dept.DTO로_변환한다());
  }
}

/**
 * 상위 부서 조회 쿼리 핸들러
 */
@QueryHandler(GetParentDepartmentQuery)
@Injectable()
export class GetParentDepartmentQueryHandler
  implements IQueryHandler<GetParentDepartmentQuery>
{
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(
    query: GetParentDepartmentQuery,
  ): Promise<DepartmentDto | null> {
    const { departmentId } = query;
    const department = await this.departmentRepository.findById(departmentId);

    if (!department || !department.parentDepartmentId) {
      return null;
    }

    const parentDepartment = await this.departmentRepository.findById(
      department.parentDepartmentId,
    );
    return parentDepartment ? parentDepartment.DTO로_변환한다() : null;
  }
}

/**
 * 활성 직원 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetActiveEmployeesQuery)
@Injectable()
export class GetActiveEmployeesQueryHandler
  implements IQueryHandler<GetActiveEmployeesQuery>
{
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetActiveEmployeesQuery): Promise<EmployeeDto[]> {
    const employees = await this.employeeRepository.findByStatus('재직중');
    return employees.map((emp) => emp.DTO로_변환한다());
  }
}
