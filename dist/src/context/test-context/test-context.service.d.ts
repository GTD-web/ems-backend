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
import { CompleteTestEnvironmentResult } from './commands/create-complete-test-environment.handler';
import { CleanupTestDataResult } from './commands/cleanup-test-data.handler';
import { CleanupEvaluationQuestionDataResult } from './commands/cleanup-evaluation-question-data.handler';
import { TestEnvironmentStatus } from './queries/get-test-environment-status.handler';
import { EmployeeTestService } from '../../domain/common/employee/employee-test.service';
export declare class TestContextService {
    private readonly commandBus;
    private readonly queryBus;
    private readonly employeeTestService;
    constructor(commandBus: CommandBus, queryBus: QueryBus, employeeTestService: EmployeeTestService);
    완전한_테스트환경을_생성한다(): Promise<CompleteTestEnvironmentResult>;
    테스트용_질문그룹을_생성한다(createdBy: string): Promise<QuestionGroupDto[]>;
    테스트용_평가질문을_생성한다(createdBy: string): Promise<EvaluationQuestionDto[]>;
    질문그룹에_질문을_매핑한다(groupId: string, questionIds: string[], createdBy: string): Promise<QuestionGroupMappingDto[]>;
    테스트_데이터를_정리한다(): Promise<CleanupTestDataResult>;
    평가질문_테스트데이터를_정리한다(): Promise<CleanupEvaluationQuestionDataResult>;
    테스트환경_상태를_확인한다(): Promise<TestEnvironmentStatus>;
    직원_데이터를_확인하고_준비한다(minCount?: number): Promise<EmployeeDto[]>;
    테스트용_평가기간을_생성한다(): Promise<EvaluationPeriodDto[]>;
    부서와_직원을_생성한다(): Promise<{
        departments: DepartmentDto[];
        employees: EmployeeDto[];
    }>;
    프로젝트와_WBS를_생성한다(projectCount?: number): Promise<{
        projects: ProjectDto[];
        wbsItems: WbsItemDto[];
    }>;
    특정_부서에_직원을_추가한다(departmentId: string, employeeCount?: number): Promise<EmployeeDto[]>;
    특정_프로젝트에_WBS를_추가한다(projectId: string, wbsCount?: number): Promise<WbsItemDto[]>;
    매니저_하위직원_관계를_생성한다(managerCount?: number, employeesPerManager?: number): Promise<EmployeeDto[]>;
    계층구조_WBS를_생성한다(projectId: string, maxLevel?: number, itemsPerLevel?: number): Promise<WbsItemDto[]>;
    평가시스템용_완전한_테스트데이터를_생성한다(): Promise<{
        departments: DepartmentDto[];
        employees: EmployeeDto[];
        projects: ProjectDto[];
        wbsItems: WbsItemDto[];
        periods: EvaluationPeriodDto[];
    }>;
    테스트용_WBS할당을_생성한다(employees: EmployeeDto[], projects: ProjectDto[], wbsItems: WbsItemDto[], periods: EvaluationPeriodDto[]): Promise<EvaluationWbsAssignmentDto[]>;
    평가기간_테스트데이터를_정리한다(): Promise<number>;
    모든_테스트데이터를_삭제한다(): Promise<{
        departments: number;
        employees: number;
        projects: number;
        wbsItems: number;
    }>;
}
