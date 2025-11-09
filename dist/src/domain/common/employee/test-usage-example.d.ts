import { EmployeeTestService } from './employee-test.service';
export declare class EmployeeTestUsageExample {
    private readonly employeeTestService;
    constructor(employeeTestService: EmployeeTestService);
    기본_테스트데이터_생성_예시(): Promise<{
        basic: import("./employee.types").EmployeeDto[];
        custom: import("./employee.types").EmployeeDto;
        random: import("./employee.types").EmployeeDto[];
        department: import("./employee.types").EmployeeDto[];
        managerEmployee: import("./employee.types").EmployeeDto[];
    }>;
    테스트데이터_정리_예시(): Promise<void>;
    전체_테스트_시나리오(): Promise<{
        testData: {
            basic: import("./employee.types").EmployeeDto[];
            custom: import("./employee.types").EmployeeDto;
            random: import("./employee.types").EmployeeDto[];
            department: import("./employee.types").EmployeeDto[];
            managerEmployee: import("./employee.types").EmployeeDto[];
        };
    }>;
}
export declare class EmployeeTestHelpers {
    private readonly employeeTestService;
    constructor(employeeTestService: EmployeeTestService);
    E2E_테스트용_데이터_설정(): Promise<import("./employee.types").EmployeeDto[]>;
    E2E_테스트용_데이터_정리(): Promise<number>;
    특정_테스트케이스용_데이터_생성(testCase: string): Promise<import("./employee.types").EmployeeDto[]>;
}
