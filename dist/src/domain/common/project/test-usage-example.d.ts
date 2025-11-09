import { ProjectTestService } from './project-test.service';
export declare class ProjectTestUsageExample {
    private readonly projectTestService;
    constructor(projectTestService: ProjectTestService);
    기본_테스트데이터_생성_예시(): Promise<{
        basic: import("./project.types").ProjectDto[];
        custom: import("./project.types").ProjectDto;
        random: import("./project.types").ProjectDto[];
        active: import("./project.types").ProjectDto[];
        manager: import("./project.types").ProjectDto[];
        period: import("./project.types").ProjectDto[];
    }>;
    테스트데이터_정리_예시(): Promise<void>;
    전체_테스트_시나리오(): Promise<{
        testData: {
            basic: import("./project.types").ProjectDto[];
            custom: import("./project.types").ProjectDto;
            random: import("./project.types").ProjectDto[];
            active: import("./project.types").ProjectDto[];
            manager: import("./project.types").ProjectDto[];
            period: import("./project.types").ProjectDto[];
        };
    }>;
}
export declare class ProjectTestHelpers {
    private readonly projectTestService;
    constructor(projectTestService: ProjectTestService);
    E2E_테스트용_데이터_설정(): Promise<import("./project.types").ProjectDto[]>;
    E2E_테스트용_데이터_정리(): Promise<number>;
    특정_테스트케이스용_데이터_생성(testCase: string): Promise<import("./project.types").ProjectDto[]>;
}
