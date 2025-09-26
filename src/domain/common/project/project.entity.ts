import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { ProjectStatus, ProjectDto } from './project.types';
import { IProject } from './project.interface';

/**
 * 프로젝트 엔티티 (평가 시스템 전용)
 *
 * 평가 시스템에서 사용하는 프로젝트 정보만 관리합니다.
 * 외부 시스템 연동 없이 독립적으로 운영됩니다.
 */
@Entity('project')
export class Project extends BaseEntity<ProjectDto> implements IProject {
  @Column({
    type: 'varchar',
    length: 255,
    comment: '프로젝트명',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '프로젝트 코드',
  })
  projectCode?: string;

  @Column({
    type: 'enum',
    enum: [...Object.values(ProjectStatus)],
    default: ProjectStatus.ACTIVE,
    comment: '프로젝트 상태',
  })
  status: ProjectStatus;

  @Column({
    type: 'date',
    nullable: true,
    comment: '시작일',
  })
  startDate?: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: '종료일',
  })
  endDate?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '프로젝트 매니저 ID',
  })
  managerId?: string;

  constructor(
    name?: string,
    projectCode?: string,
    status?: ProjectStatus,
    startDate?: Date,
    endDate?: Date,
    managerId?: string,
  ) {
    super();
    if (name) this.name = name;
    if (projectCode) this.projectCode = projectCode;
    if (status) this.status = status;
    if (startDate) this.startDate = startDate;
    if (endDate) this.endDate = endDate;
    if (managerId) this.managerId = managerId;
    this.status = status || ProjectStatus.ACTIVE;
  }

  /**
   * Project 엔티티를 DTO로 변환한다 (평가 시스템 전용)
   */
  DTO변환한다(): ProjectDto {
    return {
      // BaseEntity 필드들
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,

      // Project 엔티티 필드들 (평가 시스템 전용)
      name: this.name,
      projectCode: this.projectCode,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      managerId: this.managerId,

      // 계산된 필드들
      get isDeleted() {
        return this.deletedAt !== null && this.deletedAt !== undefined;
      },
      get isActive() {
        return this.status === ProjectStatus.ACTIVE;
      },
      get isCompleted() {
        return this.status === ProjectStatus.COMPLETED;
      },
      get isCancelled() {
        return this.status === ProjectStatus.CANCELLED;
      },
    };
  }
}
