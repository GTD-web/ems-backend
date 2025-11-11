export declare class WbsAssignmentUtils {
    static WBS할당고유키생성한다(periodId: string, employeeId: string, projectId: string, wbsItemId: string): string;
    static WBS할당고유키파싱한다(uniqueKey: string): {
        periodId: string;
        employeeId: string;
        projectId: string;
        wbsItemId: string;
    };
    static WBS할당날짜유효한가(assignedDate: Date, periodStartDate: Date, periodEndDate: Date): boolean;
    static WBS할당후경과시간계산한다(assignedDate: Date, currentDate?: Date): number;
    static WBS할당후경과일수계산한다(assignedDate: Date, currentDate?: Date): number;
    static 최근WBS할당인가(assignedDate: Date, currentDate?: Date): boolean;
    static 오래된WBS할당인가(assignedDate: Date, currentDate?: Date): boolean;
    static 평가기간별그룹화한다<T extends {
        periodId: string;
    }>(assignments: T[]): Record<string, T[]>;
    static 직원별그룹화한다<T extends {
        employeeId: string;
    }>(assignments: T[]): Record<string, T[]>;
    static 프로젝트별그룹화한다<T extends {
        projectId: string;
    }>(assignments: T[]): Record<string, T[]>;
    static WBS항목별그룹화한다<T extends {
        wbsItemId: string;
    }>(assignments: T[]): Record<string, T[]>;
    static WBS할당일기준정렬한다<T extends {
        assignedDate: Date;
    }>(assignments: T[], order?: 'ASC' | 'DESC'): T[];
    static 기간내WBS할당필터링한다<T extends {
        assignedDate: Date;
    }>(assignments: T[], startDate: Date, endDate: Date): T[];
    static WBS할당통계계산한다<T extends {
        periodId: string;
        employeeId: string;
        projectId: string;
        wbsItemId: string;
        assignedDate: Date;
    }>(assignments: T[]): {
        totalCount: number;
        periodCount: number;
        employeeCount: number;
        projectCount: number;
        wbsItemCount: number;
        recentCount: number;
        oldCount: number;
    };
    static WBS할당ID목록생성한다<T extends {
        id: string;
    }>(assignments: T[]): string[];
    static 중복WBS할당찾기<T extends {
        periodId: string;
        employeeId: string;
        projectId: string;
        wbsItemId: string;
    }>(assignments: T[]): Record<string, T[]>;
    static 프로젝트직원매트릭스생성한다<T extends {
        projectId: string;
        employeeId: string;
        wbsItemId: string;
    }>(assignments: T[]): Record<string, Record<string, string[]>>;
    static 직원별작업부하계산한다<T extends {
        employeeId: string;
        projectId: string;
        wbsItemId: string;
    }>(assignments: T[]): Record<string, {
        totalAssignments: number;
        projectCount: number;
        wbsItemCount: number;
    }>;
    static WBS계층정보추출한다(wbsCode: string): {
        level: number;
        parentCode: string | null;
        isLeaf: boolean;
        depth: number;
    };
    static WBS할당유효성검증한다(assignment: {
        periodId: string;
        employeeId: string;
        projectId: string;
        wbsItemId: string;
        assignedDate: Date;
    }): {
        isValid: boolean;
        errors: string[];
    };
}
