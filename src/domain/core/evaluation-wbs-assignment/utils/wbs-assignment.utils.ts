/**
 * 평가 WBS 할당 유틸리티 클래스
 * 평가 WBS 할당 관련 계산 및 검증 기능을 제공합니다.
 */
export class WbsAssignmentUtils {
  /**
   * WBS 할당 고유 키를 생성한다
   * @param periodId 평가기간 ID
   * @param employeeId 직원 ID
   * @param projectId 프로젝트 ID
   * @param wbsItemId WBS 항목 ID
   * @returns 고유 키
   */
  static WBS할당고유키생성한다(
    periodId: string,
    employeeId: string,
    projectId: string,
    wbsItemId: string,
  ): string {
    return `${periodId}:${employeeId}:${projectId}:${wbsItemId}`;
  }

  /**
   * WBS 할당 고유 키를 파싱한다
   * @param uniqueKey 고유 키
   * @returns 파싱된 ID 객체
   */
  static WBS할당고유키파싱한다(uniqueKey: string): {
    periodId: string;
    employeeId: string;
    projectId: string;
    wbsItemId: string;
  } {
    const parts = uniqueKey.split(':');
    if (parts.length !== 4) {
      throw new Error('유효하지 않은 WBS 할당 고유 키 형식입니다.');
    }

    return {
      periodId: parts[0],
      employeeId: parts[1],
      projectId: parts[2],
      wbsItemId: parts[3],
    };
  }

  /**
   * WBS 할당 날짜가 유효한지 확인한다
   * @param assignedDate 할당일
   * @param periodStartDate 평가기간 시작일
   * @param periodEndDate 평가기간 종료일
   * @returns 유효성 여부
   */
  static WBS할당날짜유효한가(
    assignedDate: Date,
    periodStartDate: Date,
    periodEndDate: Date,
  ): boolean {
    return assignedDate >= periodStartDate && assignedDate <= periodEndDate;
  }

  /**
   * WBS 할당 후 경과 시간을 계산한다 (시간 단위)
   * @param assignedDate 할당일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 경과 시간 (시간)
   */
  static WBS할당후경과시간계산한다(
    assignedDate: Date,
    currentDate?: Date,
  ): number {
    const now = currentDate || new Date();
    const diffInTime = now.getTime() - assignedDate.getTime();
    return Math.floor(diffInTime / (1000 * 60 * 60)); // 시간 단위
  }

  /**
   * WBS 할당 후 경과 일수를 계산한다
   * @param assignedDate 할당일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 경과 일수
   */
  static WBS할당후경과일수계산한다(
    assignedDate: Date,
    currentDate?: Date,
  ): number {
    const now = currentDate || new Date();
    const diffInTime = now.getTime() - assignedDate.getTime();
    return Math.floor(diffInTime / (1000 * 60 * 60 * 24)); // 일 단위
  }

  /**
   * WBS 할당이 최근 할당인지 확인한다 (24시간 이내)
   * @param assignedDate 할당일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 최근 할당 여부
   */
  static 최근WBS할당인가(assignedDate: Date, currentDate?: Date): boolean {
    const elapsedHours = this.WBS할당후경과시간계산한다(
      assignedDate,
      currentDate,
    );
    return elapsedHours <= 24;
  }

  /**
   * WBS 할당이 오래된 할당인지 확인한다 (7일 이상)
   * @param assignedDate 할당일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 오래된 할당 여부
   */
  static 오래된WBS할당인가(assignedDate: Date, currentDate?: Date): boolean {
    const elapsedDays = this.WBS할당후경과일수계산한다(
      assignedDate,
      currentDate,
    );
    return elapsedDays >= 7;
  }

  /**
   * WBS 할당 목록을 평가기간별로 그룹화한다
   * @param assignments WBS 할당 목록
   * @returns 평가기간별 그룹화된 WBS 할당 목록
   */
  static 평가기간별그룹화한다<T extends { periodId: string }>(
    assignments: T[],
  ): Record<string, T[]> {
    return assignments.reduce(
      (groups, assignment) => {
        const { periodId } = assignment;
        if (!groups[periodId]) {
          groups[periodId] = [];
        }
        groups[periodId].push(assignment);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * WBS 할당 목록을 직원별로 그룹화한다
   * @param assignments WBS 할당 목록
   * @returns 직원별 그룹화된 WBS 할당 목록
   */
  static 직원별그룹화한다<T extends { employeeId: string }>(
    assignments: T[],
  ): Record<string, T[]> {
    return assignments.reduce(
      (groups, assignment) => {
        const { employeeId } = assignment;
        if (!groups[employeeId]) {
          groups[employeeId] = [];
        }
        groups[employeeId].push(assignment);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * WBS 할당 목록을 프로젝트별로 그룹화한다
   * @param assignments WBS 할당 목록
   * @returns 프로젝트별 그룹화된 WBS 할당 목록
   */
  static 프로젝트별그룹화한다<T extends { projectId: string }>(
    assignments: T[],
  ): Record<string, T[]> {
    return assignments.reduce(
      (groups, assignment) => {
        const { projectId } = assignment;
        if (!groups[projectId]) {
          groups[projectId] = [];
        }
        groups[projectId].push(assignment);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * WBS 할당 목록을 WBS 항목별로 그룹화한다
   * @param assignments WBS 할당 목록
   * @returns WBS 항목별 그룹화된 WBS 할당 목록
   */
  static WBS항목별그룹화한다<T extends { wbsItemId: string }>(
    assignments: T[],
  ): Record<string, T[]> {
    return assignments.reduce(
      (groups, assignment) => {
        const { wbsItemId } = assignment;
        if (!groups[wbsItemId]) {
          groups[wbsItemId] = [];
        }
        groups[wbsItemId].push(assignment);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * WBS 할당 목록을 할당일 기준으로 정렬한다
   * @param assignments WBS 할당 목록
   * @param order 정렬 순서 ('ASC' | 'DESC')
   * @returns 정렬된 WBS 할당 목록
   */
  static WBS할당일기준정렬한다<T extends { assignedDate: Date }>(
    assignments: T[],
    order: 'ASC' | 'DESC' = 'DESC',
  ): T[] {
    return [...assignments].sort((a, b) => {
      const dateA = new Date(a.assignedDate).getTime();
      const dateB = new Date(b.assignedDate).getTime();
      return order === 'ASC' ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * 특정 기간 내의 WBS 할당을 필터링한다
   * @param assignments WBS 할당 목록
   * @param startDate 시작일
   * @param endDate 종료일
   * @returns 필터링된 WBS 할당 목록
   */
  static 기간내WBS할당필터링한다<T extends { assignedDate: Date }>(
    assignments: T[],
    startDate: Date,
    endDate: Date,
  ): T[] {
    return assignments.filter((assignment) => {
      const assignedDate = new Date(assignment.assignedDate);
      return assignedDate >= startDate && assignedDate <= endDate;
    });
  }

  /**
   * WBS 할당 통계를 계산한다
   * @param assignments WBS 할당 목록
   * @returns WBS 할당 통계
   */
  static WBS할당통계계산한다<
    T extends {
      periodId: string;
      employeeId: string;
      projectId: string;
      wbsItemId: string;
      assignedDate: Date;
    },
  >(
    assignments: T[],
  ): {
    totalCount: number;
    periodCount: number;
    employeeCount: number;
    projectCount: number;
    wbsItemCount: number;
    recentCount: number;
    oldCount: number;
  } {
    const uniquePeriods = new Set(assignments.map((a) => a.periodId));
    const uniqueEmployees = new Set(assignments.map((a) => a.employeeId));
    const uniqueProjects = new Set(assignments.map((a) => a.projectId));
    const uniqueWbsItems = new Set(assignments.map((a) => a.wbsItemId));

    const recentCount = assignments.filter((a) =>
      this.최근WBS할당인가(a.assignedDate),
    ).length;
    const oldCount = assignments.filter((a) =>
      this.오래된WBS할당인가(a.assignedDate),
    ).length;

    return {
      totalCount: assignments.length,
      periodCount: uniquePeriods.size,
      employeeCount: uniqueEmployees.size,
      projectCount: uniqueProjects.size,
      wbsItemCount: uniqueWbsItems.size,
      recentCount,
      oldCount,
    };
  }

  /**
   * WBS 할당 ID 목록을 생성한다
   * @param assignments WBS 할당 목록
   * @returns ID 목록
   */
  static WBS할당ID목록생성한다<T extends { id: string }>(
    assignments: T[],
  ): string[] {
    return assignments.map((assignment) => assignment.id);
  }

  /**
   * 중복 WBS 할당을 찾는다
   * @param assignments WBS 할당 목록
   * @returns 중복 WBS 할당 그룹
   */
  static 중복WBS할당찾기<
    T extends {
      periodId: string;
      employeeId: string;
      projectId: string;
      wbsItemId: string;
    },
  >(assignments: T[]): Record<string, T[]> {
    const groups = assignments.reduce(
      (acc, assignment) => {
        const key = this.WBS할당고유키생성한다(
          assignment.periodId,
          assignment.employeeId,
          assignment.projectId,
          assignment.wbsItemId,
        );
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(assignment);
        return acc;
      },
      {} as Record<string, T[]>,
    );

    // 중복된 것만 반환
    return Object.fromEntries(
      Object.entries(groups).filter(
        ([_, assignments]) => assignments.length > 1,
      ),
    );
  }

  /**
   * 프로젝트별 WBS 할당 매트릭스를 생성한다
   * @param assignments WBS 할당 목록
   * @returns 프로젝트-직원 매트릭스
   */
  static 프로젝트직원매트릭스생성한다<
    T extends {
      projectId: string;
      employeeId: string;
      wbsItemId: string;
    },
  >(assignments: T[]): Record<string, Record<string, string[]>> {
    const matrix: Record<string, Record<string, string[]>> = {};

    assignments.forEach((assignment) => {
      const { projectId, employeeId, wbsItemId } = assignment;

      if (!matrix[projectId]) {
        matrix[projectId] = {};
      }

      if (!matrix[projectId][employeeId]) {
        matrix[projectId][employeeId] = [];
      }

      if (!matrix[projectId][employeeId].includes(wbsItemId)) {
        matrix[projectId][employeeId].push(wbsItemId);
      }
    });

    return matrix;
  }

  /**
   * 직원별 작업 부하를 계산한다
   * @param assignments WBS 할당 목록
   * @returns 직원별 작업 부하 정보
   */
  static 직원별작업부하계산한다<
    T extends {
      employeeId: string;
      projectId: string;
      wbsItemId: string;
    },
  >(
    assignments: T[],
  ): Record<
    string,
    {
      totalAssignments: number;
      projectCount: number;
      wbsItemCount: number;
    }
  > {
    const workload: Record<
      string,
      {
        totalAssignments: number;
        projectCount: number;
        wbsItemCount: number;
      }
    > = {};

    assignments.forEach((assignment) => {
      const { employeeId, projectId, wbsItemId } = assignment;

      if (!workload[employeeId]) {
        workload[employeeId] = {
          totalAssignments: 0,
          projectCount: 0,
          wbsItemCount: 0,
        };
      }

      workload[employeeId].totalAssignments++;
    });

    // 프로젝트 및 WBS 항목 수 계산
    Object.keys(workload).forEach((employeeId) => {
      const employeeAssignments = assignments.filter(
        (a) => a.employeeId === employeeId,
      );
      const uniqueProjects = new Set(
        employeeAssignments.map((a) => a.projectId),
      );
      const uniqueWbsItems = new Set(
        employeeAssignments.map((a) => a.wbsItemId),
      );

      workload[employeeId].projectCount = uniqueProjects.size;
      workload[employeeId].wbsItemCount = uniqueWbsItems.size;
    });

    return workload;
  }

  /**
   * WBS 계층 구조 정보를 추출한다 (WBS 코드 기반)
   * @param wbsCode WBS 코드 (예: "1.1.1")
   * @returns WBS 계층 정보
   */
  static WBS계층정보추출한다(wbsCode: string): {
    level: number;
    parentCode: string | null;
    isLeaf: boolean;
    depth: number;
  } {
    const parts = wbsCode.split('.');
    const level = parts.length;
    const parentCode = level > 1 ? parts.slice(0, -1).join('.') : null;

    return {
      level,
      parentCode,
      isLeaf: true, // 실제로는 하위 WBS 존재 여부를 확인해야 함
      depth: level - 1,
    };
  }

  /**
   * WBS 할당 유효성을 검증한다
   * @param assignment WBS 할당 정보
   * @returns 유효성 검증 결과
   */
  static WBS할당유효성검증한다(assignment: {
    periodId: string;
    employeeId: string;
    projectId: string;
    wbsItemId: string;
    assignedDate: Date;
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 필수 필드 검증
    if (!assignment.periodId?.trim()) {
      errors.push('평가기간 ID가 필요합니다.');
    }

    if (!assignment.employeeId?.trim()) {
      errors.push('직원 ID가 필요합니다.');
    }

    if (!assignment.projectId?.trim()) {
      errors.push('프로젝트 ID가 필요합니다.');
    }

    if (!assignment.wbsItemId?.trim()) {
      errors.push('WBS 항목 ID가 필요합니다.');
    }

    // 날짜 검증
    if (!assignment.assignedDate || isNaN(assignment.assignedDate.getTime())) {
      errors.push('유효한 할당일이 필요합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
