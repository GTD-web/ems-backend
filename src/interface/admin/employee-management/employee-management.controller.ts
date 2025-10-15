import { Body, Controller, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationManagementService } from '../../../context/organization-management-context/organization-management.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
import {
  DepartmentHierarchyDto,
  DepartmentHierarchyWithEmployeesDto,
} from '../../../context/organization-management-context/interfaces/organization-management-context.interface';
import { ParseId } from '../../decorators/parse-uuid.decorator';
import {
  ExcludeEmployeeFromList,
  GetAllEmployees,
  GetDepartmentHierarchy,
  GetDepartmentHierarchyWithEmployees,
  GetEmployeeDetail,
  GetExcludedEmployees,
  IncludeEmployeeInList,
} from './decorators/employee-management-api.decorators';
import {
  ExcludeEmployeeFromListDto,
  GetEmployeesQueryDto,
  IncludeEmployeeInListDto,
} from './dto/employee-management.dto';

/**
 * 관리자용 직원 관리 컨트롤러
 *
 * 직원 조회 제외/포함 설정 등 관리자 권한이 필요한
 * 직원 관리 기능을 제공합니다.
 */
@ApiTags('A-1. 관리자 - 조직 관리')
@Controller('admin/employees')
// @UseGuards(AdminGuard) // TODO: 관리자 권한 가드 추가
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
    // includeExcluded 옵션에 따라 제외된 직원 포함 여부 결정
    if (query.includeExcluded) {
      // 제외된 직원 포함하여 전체 조회
      return await this.organizationManagementService.전체직원목록조회();
    } else {
      // 기본적으로 제외되지 않은 직원만 조회
      return await this.organizationManagementService.전체직원목록조회();
    }
  }

  /**
   * 조회에서 제외된 직원 목록을 조회합니다.
   */
  @GetExcludedEmployees()
  async getExcludedEmployees(): Promise<EmployeeDto[]> {
    // 제외된 직원만 필터링하여 조회
    const allEmployees =
      await this.organizationManagementService.전체직원목록조회();
    return allEmployees.filter((employee) => employee.isExcludedFromList);
  }

  /**
   * 직원 상세 정보를 조회합니다.
   */
  @GetEmployeeDetail()
  async getEmployeeDetail(
    @ParseId() employeeId: string,
  ): Promise<EmployeeDto | null> {
    return await this.organizationManagementService.직원정보조회(employeeId);
  }

  // ==================== PATCH: 부분 수정 ====================

  /**
   * 직원을 조회 목록에서 제외합니다.
   */
  @ExcludeEmployeeFromList()
  async excludeEmployeeFromList(
    @ParseId() employeeId: string,
    @Body() excludeData: ExcludeEmployeeFromListDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<EmployeeDto> {
    return await this.organizationManagementService.직원조회제외(
      employeeId,
      excludeData.excludeReason,
      excludeData.excludedBy,
    );
  }

  /**
   * 직원을 조회 목록에 포함합니다.
   */
  @IncludeEmployeeInList()
  async includeEmployeeInList(
    @ParseId() employeeId: string,
    @Body() includeData: IncludeEmployeeInListDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<EmployeeDto> {
    return await this.organizationManagementService.직원조회포함(
      employeeId,
      includeData.updatedBy,
    );
  }
}
