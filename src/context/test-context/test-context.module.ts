import { Module } from '@nestjs/common';
import { TestContextService } from './test-context.service';
import { DepartmentTestModule } from '../../domain/common/department/department-test.module';
import { EmployeeTestModule } from '../../domain/common/employee/employee-test.module';
import { ProjectTestModule } from '../../domain/common/project/project-test.module';
import { WbsItemTestModule } from '../../domain/common/wbs-item/wbs-item-test.module';

/**
 * 테스트용 컨텍스트 모듈
 *
 * 테스트 시 사용할 통합 목데이터 생성 및 관리 기능을 제공합니다.
 * 부서, 직원, 프로젝트, WBS 항목을 연관지어 생성할 수 있습니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Module({
  imports: [
    DepartmentTestModule,
    EmployeeTestModule,
    ProjectTestModule,
    WbsItemTestModule,
  ],
  providers: [TestContextService],
  exports: [TestContextService],
})
export class TestContextModule {}
