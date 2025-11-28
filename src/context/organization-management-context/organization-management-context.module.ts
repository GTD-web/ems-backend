import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentModule } from '../../domain/common/department/department.module';
import { EmployeeModule } from '../../domain/common/employee/employee.module';
import { SSOModule } from '../../domain/common/sso/sso.module';
import { Department } from '../../domain/common/department/department.entity';
import { OrganizationManagementService } from './organization-management.service';
import { EmployeeSyncService } from './employee-sync.service';
import { DepartmentSyncService } from './department-sync.service';
import { QUERY_HANDLERS } from './queries';
import { COMMAND_HANDLERS } from './commands';

/**
 * 조직 관리 컨텍스트 모듈
 *
 * CQRS 패턴을 사용하여 부서와 직원 정보 조회 및 관리 기능을 제공합니다.
 * 조직도, 부서별 직원 목록, 상하급자 관계 조회 및 직원 조회 제외/포함 기능을 포함합니다.
 * SSO를 통한 외부 직원 및 부서 정보 동기화 기능을 포함합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Department]),
    EmployeeModule,
    DepartmentModule,
    SSOModule,
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    OrganizationManagementService,
    EmployeeSyncService,
    DepartmentSyncService,
    ...QUERY_HANDLERS,
    ...COMMAND_HANDLERS,
  ],
  exports: [
    OrganizationManagementService,
    EmployeeSyncService,
    DepartmentSyncService,
    SSOModule,
  ],
})
export class OrganizationManagementContextModule {}
