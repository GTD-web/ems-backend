import { TestContextService } from './test-context.service';
export declare class TestContextUsageExample {
    private readonly testContextService;
    constructor(testContextService: TestContextService);
    기본_테스트환경_생성_예시(): Promise<import("./commands").CompleteTestEnvironmentResult>;
    부서와_직원_생성_예시(): Promise<{
        departments: import("../../domain/common/department/department.types").DepartmentDto[];
        employees: import("../../domain/common/employee/employee.types").EmployeeDto[];
        additionalEmployees: import("../../domain/common/employee/employee.types").EmployeeDto[];
        managerEmployees: import("../../domain/common/employee/employee.types").EmployeeDto[];
    }>;
    프로젝트와_WBS_생성_예시(): Promise<{
        projects: import("../../domain/common/project/project.types").ProjectDto[];
        wbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
        additionalWbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
        hierarchicalWbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
    }>;
    평가시스템용_테스트데이터_생성_예시(): Promise<{
        activeProjects: import("../../domain/common/project/project.types").ProjectDto[];
        inProgressWbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
        departments: import("../../domain/common/department/department.types").DepartmentDto[];
        employees: import("../../domain/common/employee/employee.types").EmployeeDto[];
        projects: import("../../domain/common/project/project.types").ProjectDto[];
        wbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
        periods: import("../../domain/core/evaluation-period/evaluation-period.types").EvaluationPeriodDto[];
    }>;
    테스트데이터_정리_예시(): Promise<import("./commands").CleanupTestDataResult>;
    전체_테스트_시나리오(): Promise<{
        basic: import("./commands").CompleteTestEnvironmentResult;
        organization: {
            departments: import("../../domain/common/department/department.types").DepartmentDto[];
            employees: import("../../domain/common/employee/employee.types").EmployeeDto[];
            additionalEmployees: import("../../domain/common/employee/employee.types").EmployeeDto[];
            managerEmployees: import("../../domain/common/employee/employee.types").EmployeeDto[];
        };
        project: {
            projects: import("../../domain/common/project/project.types").ProjectDto[];
            wbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
            additionalWbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
            hierarchicalWbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
        };
        evaluation: {
            activeProjects: import("../../domain/common/project/project.types").ProjectDto[];
            inProgressWbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
            departments: import("../../domain/common/department/department.types").DepartmentDto[];
            employees: import("../../domain/common/employee/employee.types").EmployeeDto[];
            projects: import("../../domain/common/project/project.types").ProjectDto[];
            wbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
            periods: import("../../domain/core/evaluation-period/evaluation-period.types").EvaluationPeriodDto[];
        };
    }>;
}
export declare class TestContextHelpers {
    private readonly testContextService;
    constructor(testContextService: TestContextService);
    E2E_테스트용_데이터_설정(): Promise<import("./commands").CompleteTestEnvironmentResult>;
    E2E_테스트용_데이터_정리(): Promise<import("./commands").CleanupTestDataResult>;
    특정_테스트케이스용_데이터_생성(testCase: string): Promise<import("../../domain/common/employee/employee.types").EmployeeDto[] | {
        departments: import("../../domain/common/department/department.types").DepartmentDto[];
        employees: import("../../domain/common/employee/employee.types").EmployeeDto[];
    } | {
        projects: import("../../domain/common/project/project.types").ProjectDto[];
        wbsItems: import("../../domain/common/wbs-item/wbs-item.types").WbsItemDto[];
    }>;
    테스트환경_상태_확인(): Promise<import("./queries").TestEnvironmentStatus>;
}
