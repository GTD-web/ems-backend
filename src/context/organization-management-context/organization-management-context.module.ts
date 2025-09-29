import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DepartmentModule } from '../../domain/common/department/department.module';
import { EmployeeModule } from '../../domain/common/employee/employee.module';
import { OrganizationManagementService } from './organization-management.service';
import { QUERY_HANDLERS } from './queries';

/**
 * 조직 관리 컨텍스트 모듈
 *
 * CQRS 패턴을 사용하여 부서와 직원 정보 조회 기능을 제공합니다.
 * 조직도, 부서별 직원 목록, 상하급자 관계 등의 조회 기능을 포함합니다.
 */
@Module({
  imports: [CqrsModule, EmployeeModule, DepartmentModule],
  providers: [OrganizationManagementService, ...QUERY_HANDLERS],
  exports: [OrganizationManagementService],
})
export class OrganizationManagementContextModule {}
