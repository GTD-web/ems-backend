import { Body, Controller, ParseBoolPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationManagementService } from '../../../context/organization-management-context/organization-management.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
import {
  DepartmentHierarchyDto,
  DepartmentHierarchyWithEmployeesDto,
} from '../../../context/organization-management-context/interfaces/organization-management-context.interface';
import { ParseId } from '@interface/common/decorators/parse-uuid.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import {
  ExcludeEmployeeFromList,
  GetAllEmployees,
  GetDepartmentHierarchy,
  GetDepartmentHierarchyWithEmployees,
  GetExcludedEmployees,
  IncludeEmployeeInList,
  UpdateEmployeeAccessibility,
} from './decorators/employee-management-api.decorators';
import {
  ExcludeEmployeeFromListDto,
  GetEmployeesQueryDto,
  UpdateEmployeeAccessibilityQueryDto,
} from './dto/employee-management.dto';

/**
 * 관리자용 직원 관리 컨트롤러
 *
 * 직원 조회 제외/포함 설정 등 관리자 권한이 필요한
 * 직원 관리 기능을 제공합니다.
 */
@ApiTags('A-1. 관리자 - 조직 관리')
@ApiBearerAuth('Bearer')
@Controller('admin/employees')
export class EmployeeManagementController {
  constructor(
    private readonly organizationManagementService: OrganizationManagementService,
  ) {}

  // ==================== GET: 조회 ====================

  /**
   * 부서 하이라키 구조를 조회합니다.
   */
  @GetDepartmentHierarchy()
  async getDepartmentHierarchy(): Promise<DepartmentHierarchyDto[]> {
    return await this.organizationManagementService.부서하이라키조회();
  }

  /**
   * 직원 목록을 포함한 부서 하이라키 구조를 조회합니다.
   */
  @GetDepartmentHierarchyWithEmployees()
  async getDepartmentHierarchyWithEmployees(): Promise<
    DepartmentHierarchyWithEmployeesDto[]
  > {
    return await this.organizationManagementService.부서하이라키_직원포함_조회();
  }

  /**
   * 전체 직원 목록을 조회합니다.
   */
  @GetAllEmployees()
  async getAllEmployees(
    @Query() query: GetEmployeesQueryDto,
  ): Promise<EmployeeDto[]> {
    // departmentId와 includeExcluded 옵션을 전달하여 조회
    return await this.organizationManagementService.전체직원목록조회(
      query.includeExcluded || false,
      query.departmentId,
    );
  }

  /**
   * 조회에서 제외된 직원 목록을 조회합니다.
   */
  @GetExcludedEmployees()
  async getExcludedEmployees(): Promise<EmployeeDto[]> {
    // 제외된 직원만 필터링하여 조회 (includeExcluded: true로 전체 조회 후 필터링)
    const allEmployees =
      await this.organizationManagementService.전체직원목록조회(true);
    return allEmployees.filter((employee) => employee.isExcludedFromList);
  }

  // ==================== PATCH: 부분 수정 ====================

  /**
   * 직원을 조회 목록에서 제외합니다.
   */
  @ExcludeEmployeeFromList()
  async excludeEmployeeFromList(
    @ParseId() employeeId: string,
    @Body() excludeData: ExcludeEmployeeFromListDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeDto> {
    return await this.organizationManagementService.직원조회제외(
      employeeId,
      excludeData.excludeReason,
      user.id,
    );
  }

  /**
   * 직원을 조회 목록에 포함합니다.
   */
  @IncludeEmployeeInList()
  async includeEmployeeInList(
    @ParseId() employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeDto> {
    return await this.organizationManagementService.직원조회포함(
      employeeId,
      user.id,
    );
  }

  /**
   * 직원의 접근 가능 여부를 변경합니다.
   */
  @UpdateEmployeeAccessibility()
  async updateEmployeeAccessibility(
    @ParseId() employeeId: string,
    @Query('isAccessible', ParseBoolPipe) isAccessible: boolean,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeDto> {
    return await this.organizationManagementService.직원접근가능여부변경(
      employeeId,
      isAccessible,
      user.id,
    );
  }
}
