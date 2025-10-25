import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { EmployeeRepository } from './employee.repository';
import { EmployeeService } from './employee.service';
import { EmployeeTestService } from './employee-test.service';

/**
 * Employee 도메인 모듈
 *
 * 순수한 Employee 엔티티 관리만 담당합니다.
 * SSO 동기화는 OrganizationManagementContext에서 처리합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Employee])],
  providers: [EmployeeRepository, EmployeeService, EmployeeTestService],
  exports: [EmployeeRepository, EmployeeService, EmployeeTestService],
})
export class EmployeeModule {}
