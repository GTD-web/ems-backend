import { Injectable } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { DepartmentDto } from '../../domain/common/department/department.types';
import { EmployeeDto } from '../../domain/common/employee/employee.types';
import {
  IOrganizationManagementContext,
  OrganizationChartDto,
  DepartmentHierarchyDto,
  DepartmentHierarchyWithEmployeesDto,
} from './interfaces/organization-management-context.interface';
import {
  GetAllDepartmentsQuery,
  GetDepartmentQuery,
  GetEmployeesByDepartmentQuery,
  GetOrganizationChartQuery,
  GetAllEmployeesQuery,
  GetManagerQuery,
  GetSubordinatesQuery,
  GetSubDepartmentsQuery,
  GetParentDepartmentQuery,
  GetActiveEmployeesQuery,
  GetDepartmentHierarchyQuery,
  GetDepartmentHierarchyWithEmployeesQuery,
} from './queries';
import {
  ExcludeEmployeeFromListCommand,
  IncludeEmployeeInListCommand,
} from './commands';
import { SSOService } from '../../domain/common/sso/sso.service';
import type { EmployeeInfo } from '../../domain/common/sso/interfaces';

/**
 * 조직 관리 서비스
 *
 * 부서와 직원 정보 조회 기능을 제공하는 서비스입니다.
 * CQRS 패턴을 사용하여 쿼리를 처리합니다.
 * SSO를 통한 외부 직원 정보 동기화 기능을 포함합니다.
 */
@Injectable()
export class OrganizationManagementService
  implements IOrganizationManagementContext
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly ssoService: SSOService,
  ) {}

  /**
   * 모든 부서 목록을 조회합니다
   */
  async 전체부서목록조회(): Promise<DepartmentDto[]> {
    return await this.queryBus.execute(new GetAllDepartmentsQuery());
  }

  /**
   * 부서 정보를 조회합니다
   */
  async 부서정보조회(departmentId: string): Promise<DepartmentDto | null> {
    return await this.queryBus.execute(new GetDepartmentQuery(departmentId));
  }

  /**
   * 부서별 직원 목록을 조회합니다
   */
  async 부서별직원목록조회(departmentId: string): Promise<EmployeeDto[]> {
    return await this.queryBus.execute(
      new GetEmployeesByDepartmentQuery(departmentId),
    );
  }

  /**
   * 조직도를 조회합니다
   */
  async 조직도조회(): Promise<OrganizationChartDto> {
    return await this.queryBus.execute(new GetOrganizationChartQuery());
  }

  /**
   * 모든 직원 목록을 조회합니다
   */
  async 전체직원목록조회(
    includeExcluded: boolean = false,
  ): Promise<EmployeeDto[]> {
    return await this.queryBus.execute(
      new GetAllEmployeesQuery(includeExcluded),
    );
  }

  /**
   * 직원의 상급자를 조회합니다
   */
  async 상급자조회(employeeId: string): Promise<EmployeeDto | null> {
    return await this.queryBus.execute(new GetManagerQuery(employeeId));
  }

  /**
   * 직원의 하급자 목록을 조회합니다
   */
  async 하급자목록조회(employeeId: string): Promise<EmployeeDto[]> {
    return await this.queryBus.execute(new GetSubordinatesQuery(employeeId));
  }

  /**
   * 부서의 하위 부서 목록을 조회합니다
   */
  async 하위부서목록조회(departmentId: string): Promise<DepartmentDto[]> {
    return await this.queryBus.execute(
      new GetSubDepartmentsQuery(departmentId),
    );
  }

  /**
   * 부서의 상위 부서를 조회합니다
   */
  async 상위부서조회(departmentId: string): Promise<DepartmentDto | null> {
    return await this.queryBus.execute(
      new GetParentDepartmentQuery(departmentId),
    );
  }

  /**
   * 활성 직원 목록을 조회합니다
   */
  async 활성직원목록조회(): Promise<EmployeeDto[]> {
    return await this.queryBus.execute(new GetActiveEmployeesQuery());
  }

  /**
   * 직원을 조회 목록에서 제외합니다
   */
  async 직원조회제외(
    employeeId: string,
    excludeReason: string,
    excludedBy: string,
  ): Promise<EmployeeDto> {
    return await this.commandBus.execute(
      new ExcludeEmployeeFromListCommand(employeeId, excludeReason, excludedBy),
    );
  }

  /**
   * 직원을 조회 목록에 포함합니다
   */
  async 직원조회포함(
    employeeId: string,
    updatedBy: string,
  ): Promise<EmployeeDto> {
    return await this.commandBus.execute(
      new IncludeEmployeeInListCommand(employeeId, updatedBy),
    );
  }

  /**
   * 부서 하이라키 구조를 조회합니다
   */
  async 부서하이라키조회(): Promise<DepartmentHierarchyDto[]> {
    return await this.queryBus.execute(new GetDepartmentHierarchyQuery());
  }

  /**
   * 직원 목록을 포함한 부서 하이라키 구조를 조회합니다
   */
  async 부서하이라키_직원포함_조회(): Promise<
    DepartmentHierarchyWithEmployeesDto[]
  > {
    return await this.queryBus.execute(
      new GetDepartmentHierarchyWithEmployeesQuery(),
    );
  }

  // ========== SSO 연동 메서드 ==========

  /**
   * SSO에서 모든 직원 정보를 조회합니다 (동기화용)
   */
  async SSO에서_직원정보를_조회한다(
    includeTerminated: boolean = false,
  ): Promise<EmployeeInfo[]> {
    return await this.ssoService.여러직원정보를조회한다({
      withDetail: true,
      includeTerminated,
    });
  }

  /**
   * SSO에서 특정 직원 정보를 조회합니다
   */
  async SSO에서_사번으로_직원을_조회한다(
    employeeNumber: string,
  ): Promise<EmployeeInfo> {
    return await this.ssoService.사번으로직원을조회한다(employeeNumber);
  }

  /**
   * SSO에서 이메일로 직원 정보를 조회합니다
   */
  async SSO에서_이메일로_직원을_조회한다(
    email: string,
  ): Promise<EmployeeInfo | null> {
    return await this.ssoService.이메일로직원을조회한다(email);
  }
}
