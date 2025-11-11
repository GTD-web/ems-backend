import { WbsItemTestService } from './wbs-item-test.service';
export declare class WbsItemTestUsageExample {
    private readonly wbsItemTestService;
    constructor(wbsItemTestService: WbsItemTestService);
    기본_테스트데이터_생성_예시(projectId: string): Promise<{
        basic: import("./wbs-item.types").WbsItemDto[];
        custom: import("./wbs-item.types").WbsItemDto;
        random: import("./wbs-item.types").WbsItemDto[];
        completed: import("./wbs-item.types").WbsItemDto[];
        assignee: import("./wbs-item.types").WbsItemDto[];
        hierarchical: import("./wbs-item.types").WbsItemDto[];
    }>;
    테스트데이터_정리_예시(): Promise<void>;
    전체_테스트_시나리오(projectId: string): Promise<{
        testData: {
            basic: import("./wbs-item.types").WbsItemDto[];
            custom: import("./wbs-item.types").WbsItemDto;
            random: import("./wbs-item.types").WbsItemDto[];
            completed: import("./wbs-item.types").WbsItemDto[];
            assignee: import("./wbs-item.types").WbsItemDto[];
            hierarchical: import("./wbs-item.types").WbsItemDto[];
        };
    }>;
}
export declare class WbsItemTestHelpers {
    private readonly wbsItemTestService;
    constructor(wbsItemTestService: WbsItemTestService);
    E2E_테스트용_데이터_설정(projectId: string): Promise<import("./wbs-item.types").WbsItemDto[]>;
    E2E_테스트용_데이터_정리(): Promise<number>;
    특정_테스트케이스용_데이터_생성(testCase: string, projectId: string): Promise<import("./wbs-item.types").WbsItemDto[]>;
}
