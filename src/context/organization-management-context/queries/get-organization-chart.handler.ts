import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentService } from '../../../domain/common/department/department.service';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';
import type {
  OrganizationChartDto,
  DepartmentWithEmployeesDto,
} from '../interfaces/organization-management-context.interface';

/**
 * 조직도 조회 쿼리
 */
export class GetOrganizationChartQuery implements IQuery {}

/**
 * 조직도 조회 쿼리 핸들러
 */
@QueryHandler(GetOrganizationChartQuery)
@Injectable()
export class GetOrganizationChartQueryHandler
  implements IQueryHandler<GetOrganizationChartQuery>
{
  constructor(
    private readonly departmentService: DepartmentService,
    private readonly employeeService: EmployeeService,
  ) {}

  async execute(
    query: GetOrganizationChartQuery,
  ): Promise<OrganizationChartDto> {
    const allDepartments = await this.departmentService.findAll();
    const allEmployees = await this.employeeService.findAll();

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
    // externalId를 키로 사용하여 매핑 (parentDepartmentId가 외부 시스템 ID이기 때문)
    const departmentByExternalId = new Map<
      string,
      DepartmentWithEmployeesDto
    >();
    const rootDepartments: DepartmentWithEmployeesDto[] = [];

    // 모든 부서를 맵에 추가 (externalId를 키로 사용)
    allDepartments.forEach((dept) => {
      const deptDto = dept.DTO로_변환한다();
      const deptWithEmployees: DepartmentWithEmployeesDto = {
        ...deptDto,
        employees: employeesByDept[dept.id] || [],
        subDepartments: [],
      };
      departmentByExternalId.set(dept.externalId, deptWithEmployees);
    });

    // 부서 계층 구조 구성
    allDepartments.forEach((dept) => {
      const deptWithEmployees = departmentByExternalId.get(dept.externalId)!;
      if (dept.parentDepartmentId) {
        // parentDepartmentId는 외부 시스템 ID이므로 externalId로 매칭
        const parent = departmentByExternalId.get(dept.parentDepartmentId);
        if (parent) {
          parent.subDepartments.push(deptWithEmployees);
        } else {
          // 부모를 찾을 수 없으면 루트로 취급
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
