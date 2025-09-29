/**
 * 평가 프로젝트 할당 유틸리티 클래스
 * 평가 프로젝트 할당 관련 계산 및 검증 기능을 제공합니다.
 */
export class AssignmentUtils {
  /**
   * 할당 고유 키를 생성한다
   * @param periodId 평가기간 ID
   * @param employeeId 직원 ID
   * @param projectId 프로젝트 ID
   * @returns 고유 키
   */
  static 할당고유키생성한다(
    periodId: string,
    employeeId: string,
    projectId: string,
  ): string {
    return `${periodId}:${employeeId}:${projectId}`;
  }

  /**
   * 할당 고유 키를 파싱한다
   * @param uniqueKey 고유 키
   * @returns 파싱된 ID 객체
   */
  static 할당고유키파싱한다(uniqueKey: string): {
    periodId: string;
    employeeId: string;
    projectId: string;
  } {
    const parts = uniqueKey.split(':');
    if (parts.length !== 3) {
      throw new Error('유효하지 않은 할당 고유 키 형식입니다.');
    }

    return {
      periodId: parts[0],
      employeeId: parts[1],
      projectId: parts[2],
    };
  }

  /**
   * 할당 날짜가 유효한지 확인한다
   * @param assignedDate 할당일
   * @param periodStartDate 평가기간 시작일
   * @param periodEndDate 평가기간 종료일
   * @returns 유효성 여부
   */
  static 할당날짜유효한가(
    assignedDate: Date,
    periodStartDate: Date,
    periodEndDate: Date,
  ): boolean {
    return assignedDate >= periodStartDate && assignedDate <= periodEndDate;
  }

  /**
   * 할당 후 경과 시간을 계산한다 (시간 단위)
   * @param assignedDate 할당일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 경과 시간 (시간)
   */
  static 할당후경과시간계산한다(
    assignedDate: Date,
    currentDate?: Date,
  ): number {
    const now = currentDate || new Date();
    const diffInTime = now.getTime() - assignedDate.getTime();
    return Math.floor(diffInTime / (1000 * 60 * 60)); // 시간 단위
  }

  /**
   * 할당 후 경과 일수를 계산한다
   * @param assignedDate 할당일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 경과 일수
   */
  static 할당후경과일수계산한다(
    assignedDate: Date,
    currentDate?: Date,
  ): number {
    const now = currentDate || new Date();
    const diffInTime = now.getTime() - assignedDate.getTime();
    return Math.floor(diffInTime / (1000 * 60 * 60 * 24)); // 일 단위
  }

  /**
   * 할당이 최근 할당인지 확인한다 (24시간 이내)
   * @param assignedDate 할당일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 최근 할당 여부
   */
  static 최근할당인가(assignedDate: Date, currentDate?: Date): boolean {
    const elapsedHours = this.할당후경과시간계산한다(assignedDate, currentDate);
    return elapsedHours <= 24;
  }

  /**
   * 할당이 오래된 할당인지 확인한다 (7일 이상)
   * @param assignedDate 할당일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 오래된 할당 여부
   */
  static 오래된할당인가(assignedDate: Date, currentDate?: Date): boolean {
    const elapsedDays = this.할당후경과일수계산한다(assignedDate, currentDate);
    return elapsedDays >= 7;
  }

  /**
   * 할당 목록을 평가기간별로 그룹화한다
   * @param assignments 할당 목록
   * @returns 평가기간별 그룹화된 할당 목록
   */
  static 평가기간별그룹화한다<T extends { periodId: string }>(
    assignments: T[],
  ): Record<string, T[]> {
    return assignments.reduce((groups, assignment) => {
      const { periodId } = assignment;
      if (!groups[periodId]) {
        groups[periodId] = [];
      }
      groups[periodId].push(assignment);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * 할당 목록을 직원별로 그룹화한다
   * @param assignments 할당 목록
   * @returns 직원별 그룹화된 할당 목록
   */
  static 직원별그룹화한다<T extends { employeeId: string }>(
    assignments: T[],
  ): Record<string, T[]> {
    return assignments.reduce((groups, assignment) => {
      const { employeeId } = assignment;
      if (!groups[employeeId]) {
        groups[employeeId] = [];
      }
      groups[employeeId].push(assignment);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * 할당 목록을 프로젝트별로 그룹화한다
   * @param assignments 할당 목록
   * @returns 프로젝트별 그룹화된 할당 목록
   */
  static 프로젝트별그룹화한다<T extends { projectId: string }>(
    assignments: T[],
  ): Record<string, T[]> {
    return assignments.reduce((groups, assignment) => {
      const { projectId } = assignment;
      if (!groups[projectId]) {
        groups[projectId] = [];
      }
      groups[projectId].push(assignment);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * 할당 목록을 할당일 기준으로 정렬한다
   * @param assignments 할당 목록
   * @param order 정렬 순서 ('ASC' | 'DESC')
   * @returns 정렬된 할당 목록
   */
  static 할당일기준정렬한다<T extends { assignedDate: Date }>(
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
   * 특정 기간 내의 할당을 필터링한다
   * @param assignments 할당 목록
   * @param startDate 시작일
   * @param endDate 종료일
   * @returns 필터링된 할당 목록
   */
  static 기간내할당필터링한다<T extends { assignedDate: Date }>(
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
   * 할당 통계를 계산한다
   * @param assignments 할당 목록
   * @returns 할당 통계
   */
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
  } {
    const uniquePeriods = new Set(assignments.map(a => a.periodId));
    const uniqueEmployees = new Set(assignments.map(a => a.employeeId));
    const uniqueProjects = new Set(assignments.map(a => a.projectId));

    const recentCount = assignments.filter(a => this.최근할당인가(a.assignedDate)).length;
    const oldCount = assignments.filter(a => this.오래된할당인가(a.assignedDate)).length;

    return {
      totalCount: assignments.length,
      periodCount: uniquePeriods.size,
      employeeCount: uniqueEmployees.size,
      projectCount: uniqueProjects.size,
      recentCount,
      oldCount,
    };
  }

  /**
   * 할당 ID 목록을 생성한다
   * @param assignments 할당 목록
   * @returns ID 목록
   */
  static 할당ID목록생성한다<T extends { id: string }>(
    assignments: T[],
  ): string[] {
    return assignments.map(assignment => assignment.id);
  }

  /**
   * 중복 할당을 찾는다
   * @param assignments 할당 목록
   * @returns 중복 할당 그룹
   */
  static 중복할당찾기<T extends { 
    periodId: string; 
    employeeId: string; 
    projectId: string;
  }>(assignments: T[]): Record<string, T[]> {
    const groups = assignments.reduce((acc, assignment) => {
      const key = this.할당고유키생성한다(
        assignment.periodId,
        assignment.employeeId,
        assignment.projectId,
      );
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(assignment);
      return acc;
    }, {} as Record<string, T[]>);

    // 중복된 것만 반환
    return Object.fromEntries(
      Object.entries(groups).filter(([_, assignments]) => assignments.length > 1)
    );
  }
}
