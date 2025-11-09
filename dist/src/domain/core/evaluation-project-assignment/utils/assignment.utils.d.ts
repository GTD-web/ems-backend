export declare class AssignmentUtils {
    static 할당고유키생성한다(periodId: string, employeeId: string, projectId: string): string;
    static 할당고유키파싱한다(uniqueKey: string): {
        periodId: string;
        employeeId: string;
        projectId: string;
    };
    static 할당날짜유효한가(assignedDate: Date, periodStartDate: Date, periodEndDate: Date): boolean;
    static 할당후경과시간계산한다(assignedDate: Date, currentDate?: Date): number;
    static 할당후경과일수계산한다(assignedDate: Date, currentDate?: Date): number;
    static 최근할당인가(assignedDate: Date, currentDate?: Date): boolean;
    static 오래된할당인가(assignedDate: Date, currentDate?: Date): boolean;
    static 평가기간별그룹화한다<T extends {
        periodId: string;
    }>(assignments: T[]): Record<string, T[]>;
    static 직원별그룹화한다<T extends {
        employeeId: string;
    }>(assignments: T[]): Record<string, T[]>;
    static 프로젝트별그룹화한다<T extends {
        projectId: string;
    }>(assignments: T[]): Record<string, T[]>;
    static 할당일기준정렬한다<T extends {
        assignedDate: Date;
    }>(assignments: T[], order?: 'ASC' | 'DESC'): T[];
    static 기간내할당필터링한다<T extends {
        assignedDate: Date;
    }>(assignments: T[], startDate: Date, endDate: Date): T[];
    static 할당통계계산한다<T extends {
        periodId: string;
        employeeId: string;
        projectId: string;
        assignedDate: Date;
    }>(assignments: T[]): {
        totalCount: number;
        periodCount: number;
        employeeCount: number;
        projectCount: number;
        recentCount: number;
        oldCount: number;
    };
    static 할당ID목록생성한다<T extends {
        id: string;
    }>(assignments: T[]): string[];
    static 중복할당찾기<T extends {
        periodId: string;
        employeeId: string;
        projectId: string;
    }>(assignments: T[]): Record<string, T[]>;
}
