import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationProjectAssignment } from './interfaces/evaluation-project-assignment.interface';
import type {
  EvaluationProjectAssignmentDto,
  CreateEvaluationProjectAssignmentData,
} from './evaluation-project-assignment.types';

/**
 * 평가 프로젝트 할당 엔티티
 * 특정 평가기간에 직원에게 할당된 프로젝트를 관리합니다.
 */
@Entity('evaluation_project_assignment')
@Index(['periodId', 'employeeId'])
@Index(['periodId', 'projectId'])
@Index(['employeeId', 'projectId'])
@Index(['assignedDate'])
export class EvaluationProjectAssignment
  extends BaseEntity<EvaluationProjectAssignmentDto>
  implements IEvaluationProjectAssignment
{
  @Column({
    type: 'varchar',
    length: 255,
    comment: '평가 기간 ID',
  })
  periodId: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '직원 ID',
  })
  employeeId: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '프로젝트 ID',
  })
  projectId: string;

  @Column({
    type: 'timestamp with time zone',
    comment: '할당일',
  })
  assignedDate: Date;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '할당자 ID',
  })
  assignedBy: string;

  constructor(data?: CreateEvaluationProjectAssignmentData) {
    super();
    if (data) {
      this.periodId = data.periodId;
      this.employeeId = data.employeeId;
      this.projectId = data.projectId;
      this.assignedBy = data.assignedBy;
      this.assignedDate = new Date();
    }
  }

  /**
   * 특정 평가기간에 속하는지 확인한다
   */
  평가기간일치하는가(periodId: string): boolean {
    return this.periodId === periodId;
  }

  /**
   * 특정 직원의 할당인지 확인한다
   */
  해당직원의할당인가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 특정 프로젝트 할당인지 확인한다
   */
  해당프로젝트할당인가(projectId: string): boolean {
    return this.projectId === projectId;
  }

  /**
   * DTO로 변환한다
   */
  DTO변환한다(): EvaluationProjectAssignmentDto {
    return {
      id: this.id,
      periodId: this.periodId,
      employeeId: this.employeeId,
      projectId: this.projectId,
      assignedDate: this.assignedDate,
      assignedBy: this.assignedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      version: this.version,
    };
  }
}
