import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';

/**
 * 프로젝트 2차 평가자 DTO
 */
export interface ProjectSecondaryEvaluatorDto {
  id: string;
  projectId: string;
  evaluatorId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

/**
 * 프로젝트 2차 평가자 엔티티
 *
 * 프로젝트별 2차 평가자로 지정 가능한 직원들을 관리합니다.
 * 프로젝트와 직원(평가자) 간의 다대다 관계를 저장합니다.
 */
@Entity('project_secondary_evaluator')
@Index(['projectId'])
@Index(['evaluatorId'])
@Index(['projectId', 'evaluatorId'])
@Unique(['projectId', 'evaluatorId'])
export class ProjectSecondaryEvaluator extends BaseEntity<ProjectSecondaryEvaluatorDto> {
  @Column({
    type: 'uuid',
    comment: '프로젝트 ID',
  })
  projectId: string;

  @Column({
    type: 'uuid',
    comment: '2차 평가자 ID (직원 ID)',
  })
  evaluatorId: string;

  /**
   * 새로운 프로젝트 2차 평가자 관계를 생성한다
   */
  static 생성한다(
    projectId: string,
    evaluatorId: string,
    createdBy: string,
  ): ProjectSecondaryEvaluator {
    const entity = new ProjectSecondaryEvaluator();
    entity.projectId = projectId;
    entity.evaluatorId = evaluatorId;
    entity.생성자를_설정한다(createdBy);
    return entity;
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): ProjectSecondaryEvaluatorDto {
    return {
      id: this.id,
      projectId: this.projectId,
      evaluatorId: this.evaluatorId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      version: this.version,
    };
  }
}

