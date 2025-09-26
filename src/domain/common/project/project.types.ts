/**
 * 프로젝트 관련 타입 정의 (평가 시스템용 간소화 버전)
 */

// 프로젝트 상태 enum
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * 프로젝트 DTO (평가 시스템용 간소화 버전)
 * 평가에 필요한 핵심 프로젝트 정보만 포함
 */
export interface ProjectDto {
  // BaseEntity 필드들
  /** 고유 식별자 (UUID) */
  id: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 (소프트 삭제) */
  deletedAt?: Date;

  // Project 엔티티 필드들 (평가 시스템 전용)
  /** 프로젝트명 */
  name: string;
  /** 프로젝트 코드 */
  projectCode?: string;
  /** 프로젝트 상태 */
  status: ProjectStatus;
  /** 시작일 */
  startDate?: Date;
  /** 종료일 */
  endDate?: Date;
  /** 프로젝트 매니저 ID */
  managerId?: string;

  // 조인된 정보 필드들
  /** 프로젝트 매니저 이름 */
  managerName?: string;

  // 계산된 필드들 (읽기 전용)
  /** 삭제된 상태 여부 */
  readonly isDeleted: boolean;
  /** 활성 상태 여부 */
  readonly isActive: boolean;
  /** 완료된 상태 여부 */
  readonly isCompleted: boolean;
  /** 취소된 상태 여부 */
  readonly isCancelled: boolean;
}

// 프로젝트 생성 DTO (평가 시스템 전용)
export interface CreateProjectDto {
  name: string;
  projectCode?: string;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  managerId?: string;
}

// 프로젝트 업데이트 DTO (평가 시스템 전용)
export interface UpdateProjectDto {
  name?: string;
  projectCode?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  managerId?: string;
}

// 프로젝트 조회 필터 (평가 시스템용 간소화 버전)
export interface ProjectFilter {
  status?: ProjectStatus;
  managerId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
}

// 프로젝트 통계 (평가 시스템용 간소화 버전)
export interface ProjectStatistics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  projectsByStatus: Record<string, number>;
  projectsByManager: Record<string, number>;
  lastSyncAt?: Date;
}

// 프로젝트 목록 조회 옵션
export interface ProjectListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'projectCode' | 'startDate' | 'endDate' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  filter?: ProjectFilter;
}
