import { Injectable } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { DepartmentDto } from '../../domain/common/department/department.types';
import { EmployeeDto } from '../../domain/common/employee/employee.types';
import { ProjectDto } from '../../domain/common/project/project.types';
import { WbsItemDto } from '../../domain/common/wbs-item/wbs-item.types';
import { EvaluationPeriodDto } from '../../domain/core/evaluation-period/evaluation-period.types';
import { EvaluationWbsAssignmentDto } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import { QuestionGroupDto } from '../../domain/sub/question-group/question-group.types';
import { EvaluationQuestionDto } from '../../domain/sub/evaluation-question/evaluation-question.types';
import { QuestionGroupMappingDto } from '../../domain/sub/question-group-mapping/question-group-mapping.types';
import {
  CreateCompleteTestEnvironmentCommand,
  CompleteTestEnvironmentResult,
} from './commands/create-complete-test-environment.handler';
import { CreateTestQuestionGroupsCommand } from './commands/create-test-question-groups.handler';
import { CreateTestQuestionsCommand } from './commands/create-test-questions.handler';
import { MapQuestionsToGroupCommand } from './commands/map-questions-to-group.handler';
import {
  CleanupTestDataCommand,
  CleanupTestDataResult,
} from './commands/cleanup-test-data.handler';
import {
  CleanupEvaluationQuestionDataCommand,
  CleanupEvaluationQuestionDataResult,
} from './commands/cleanup-evaluation-question-data.handler';
import {
  GetTestEnvironmentStatusQuery,
  TestEnvironmentStatus,
} from './queries/get-test-environment-status.handler';
import { EmployeeTestService } from '../../domain/common/employee/employee-test.service';

/**
 * 테스트용 컨텍스트 서비스
 *
 * 테스트 시 사용할 통합 목데이터를 생성하고 관리하는 서비스입니다.
 * 부서, 직원, 프로젝트, WBS 항목을 연관지어 생성합니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 *
 * CQRS 패턴을 사용하여 Command와 Query를 처리합니다.
 */
@Injectable()
export class TestContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly employeeTestService: EmployeeTestService,
  ) {}

  /**
   * 완전한 테스트 환경을 생성한다
   * @returns 생성된 모든 데이터
   */
  async 완전한_테스트환경을_생성한다(): Promise<CompleteTestEnvironmentResult> {
    return await this.commandBus.execute(
      new CreateCompleteTestEnvironmentCommand(),
    );
  }

  /**
   * 테스트용 질문 그룹을 생성한다
   * @param createdBy 생성자 ID
   * @returns 생성된 질문 그룹 목록
   */
  async 테스트용_질문그룹을_생성한다(
    createdBy: string,
  ): Promise<QuestionGroupDto[]> {
    return await this.commandBus.execute(
      new CreateTestQuestionGroupsCommand(createdBy),
    );
  }

  /**
   * 테스트용 평가 질문을 생성한다
   * @param createdBy 생성자 ID
   * @returns 생성된 평가 질문 목록
   */
  async 테스트용_평가질문을_생성한다(
    createdBy: string,
  ): Promise<EvaluationQuestionDto[]> {
    return await this.commandBus.execute(
      new CreateTestQuestionsCommand(createdBy),
    );
  }

  /**
   * 질문 그룹에 질문을 매핑한다
   * @param groupId 질문 그룹 ID
   * @param questionIds 평가 질문 ID 목록
   * @param createdBy 생성자 ID
   * @returns 생성된 매핑 목록
   */
  async 질문그룹에_질문을_매핑한다(
    groupId: string,
    questionIds: string[],
    createdBy: string,
  ): Promise<QuestionGroupMappingDto[]> {
    return await this.commandBus.execute(
      new MapQuestionsToGroupCommand(groupId, questionIds, createdBy),
    );
  }

  /**
   * 테스트 데이터를 정리한다
   * @returns 정리된 데이터 수
   */
  async 테스트_데이터를_정리한다(): Promise<CleanupTestDataResult> {
    return await this.commandBus.execute(new CleanupTestDataCommand());
  }

  /**
   * 평가 질문 테스트 데이터를 정리한다
   * @returns 정리된 데이터 수
   */
  async 평가질문_테스트데이터를_정리한다(): Promise<CleanupEvaluationQuestionDataResult> {
    return await this.commandBus.execute(
      new CleanupEvaluationQuestionDataCommand(),
    );
  }

  /**
   * 테스트 환경 상태를 확인한다
   * @returns 현재 테스트 환경 상태
   */
  async 테스트환경_상태를_확인한다(): Promise<TestEnvironmentStatus> {
    return await this.queryBus.execute(new GetTestEnvironmentStatusQuery());
  }

  /**
   * 직원 데이터만 확인하고 필요시 생성한다
   * @param minCount 최소 필요한 직원 수
   * @returns 직원 목록
   */
  async 직원_데이터를_확인하고_준비한다(
    minCount: number = 3,
  ): Promise<EmployeeDto[]> {
    console.log('=== 직원 데이터 확인 및 준비 ===');
    const employees =
      await this.employeeTestService.직원_데이터를_확인하고_생성한다(minCount);
    console.log(`준비된 직원 수: ${employees.length}`);
    return employees;
  }

  // ==================== 레거시 메서드 (하위 호환성) ====================
  // 기존 테스트 코드가 깨지지 않도록 남겨둠
  // TODO: 점진적으로 CQRS 패턴으로 마이그레이션 필요

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정. 완전한_테스트환경을_생성한다 사용 권장
   */
  async 테스트용_평가기간을_생성한다(): Promise<EvaluationPeriodDto[]> {
    const result = await this.완전한_테스트환경을_생성한다();
    return result.periods;
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 부서와_직원을_생성한다(): Promise<{
    departments: DepartmentDto[];
    employees: EmployeeDto[];
  }> {
    const result = await this.완전한_테스트환경을_생성한다();
    return {
      departments: result.departments,
      employees: result.employees,
    };
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 프로젝트와_WBS를_생성한다(projectCount: number = 3): Promise<{
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
  }> {
    const result = await this.완전한_테스트환경을_생성한다();
    return {
      projects: result.projects,
      wbsItems: result.wbsItems,
    };
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 특정_부서에_직원을_추가한다(
    departmentId: string,
    employeeCount: number = 5,
  ): Promise<EmployeeDto[]> {
    return await this.employeeTestService.부서별_직원_테스트데이터를_생성한다(
      departmentId,
      employeeCount,
    );
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 특정_프로젝트에_WBS를_추가한다(
    projectId: string,
    wbsCount: number = 10,
  ): Promise<WbsItemDto[]> {
    // 직접 구현 대신 경고 메시지 출력
    console.warn(
      '특정_프로젝트에_WBS를_추가한다는 레거시 메서드입니다. CQRS 패턴으로 마이그레이션이 필요합니다.',
    );
    return [];
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 매니저_하위직원_관계를_생성한다(
    managerCount: number = 3,
    employeesPerManager: number = 3,
  ): Promise<EmployeeDto[]> {
    return await this.employeeTestService.매니저_하위직원_테스트데이터를_생성한다(
      managerCount,
      employeesPerManager,
    );
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 계층구조_WBS를_생성한다(
    projectId: string,
    maxLevel: number = 3,
    itemsPerLevel: number = 2,
  ): Promise<WbsItemDto[]> {
    console.warn(
      '계층구조_WBS를_생성한다는 레거시 메서드입니다. CQRS 패턴으로 마이그레이션이 필요합니다.',
    );
    return [];
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 평가시스템용_완전한_테스트데이터를_생성한다(): Promise<{
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
    periods: EvaluationPeriodDto[];
  }> {
    const result = await this.완전한_테스트환경을_생성한다();
    return {
      departments: result.departments,
      employees: result.employees,
      projects: result.projects,
      wbsItems: result.wbsItems,
      periods: result.periods,
    };
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 테스트용_WBS할당을_생성한다(
    employees: EmployeeDto[],
    projects: ProjectDto[],
    wbsItems: WbsItemDto[],
    periods: EvaluationPeriodDto[],
  ): Promise<EvaluationWbsAssignmentDto[]> {
    console.warn(
      '테스트용_WBS할당을_생성한다는 레거시 메서드입니다. 완전한_테스트환경을_생성한다를 사용하세요.',
    );
    return [];
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 평가기간_테스트데이터를_정리한다(): Promise<number> {
    const result = await this.테스트_데이터를_정리한다();
    return result.periods;
  }

  /**
   * @deprecated CQRS 패턴으로 마이그레이션 예정
   */
  async 모든_테스트데이터를_삭제한다(): Promise<{
    departments: number;
    employees: number;
    projects: number;
    wbsItems: number;
  }> {
    const result = await this.테스트_데이터를_정리한다();
    return {
      departments: result.departments,
      employees: result.employees,
      projects: result.projects,
      wbsItems: result.wbsItems,
    };
  }
}
