import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IDownwardEvaluation } from './interfaces/downward-evaluation.interface';
import { DownwardEvaluationType } from './downward-evaluation.types';
import type {
  DownwardEvaluationDto,
  CreateDownwardEvaluationData,
} from './downward-evaluation.types';

/**
 * 하향평가 엔티티
 * 상관이 자기평가를 평가하는 하향평가를 관리합니다.
 * 피평가자, 평가자, 프로젝트, 평가기간 정보를 포함합니다.
 */
@Entity('downward_evaluation')
@Index(['employeeId'])
@Index(['evaluatorId'])
@Index(['projectId'])
@Index(['periodId'])
@Index(['selfEvaluationId'])
@Index(['evaluationType'])
@Index(['evaluationDate'])
@Index(['downwardEvaluationScore'])
@Index(['employeeId', 'evaluatorId', 'periodId'])
export class DownwardEvaluation
  extends BaseEntity<DownwardEvaluationDto>
  implements IDownwardEvaluation
{
  @Column({
    type: 'uuid',
    comment: '피평가자 ID',
  })
  employeeId: string;

  @Column({
    type: 'uuid',
    comment: '평가자 ID',
  })
  evaluatorId: string;

  @Column({
    type: 'uuid',
    comment: '프로젝트 ID',
  })
  projectId: string;

  @Column({
    type: 'uuid',
    comment: '평가 기간 ID',
  })
  periodId: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '자기평가 ID',
  })
  selfEvaluationId?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '하향평가 내용',
  })
  downwardEvaluationContent?: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: '하향평가 점수',
  })
  downwardEvaluationScore?: number;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '평가일',
  })
  evaluationDate: Date;

  @Column({
    type: 'enum',
    enum: ['primary', 'secondary'],
    comment: '평가 유형',
  })
  evaluationType: DownwardEvaluationType;

  @Column({
    type: 'boolean',
    default: false,
    comment: '평가 완료 여부',
  })
  isCompleted: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '평가 완료일',
  })
  completedAt?: Date;

  constructor(data?: CreateDownwardEvaluationData) {
    super();
    if (data) {
      this.employeeId = data.employeeId;
      this.evaluatorId = data.evaluatorId;
      this.projectId = data.projectId;
      this.periodId = data.periodId;
      this.selfEvaluationId = data.selfEvaluationId;
      this.downwardEvaluationContent = data.downwardEvaluationContent;
      this.downwardEvaluationScore = data.downwardEvaluationScore;
      this.evaluationType = data.evaluationType;
      this.evaluationDate = data.evaluationDate || new Date();
      this.isCompleted = data.isCompleted || false;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 하향평가가 완료되었는지 확인한다
   */
  완료되었는가(): boolean {
    return this.isCompleted;
  }

  /**
   * 하향평가 점수가 유효한지 확인한다
   */
  점수가_유효한가(): boolean {
    return (
      this.downwardEvaluationScore !== undefined &&
      this.downwardEvaluationScore >= 1 &&
      this.downwardEvaluationScore <= 5
    );
  }

  /**
   * 하향평가를 완료한다
   */
  평가를_완료한다(completedBy?: string): void {
    this.isCompleted = true;
    this.completedAt = new Date();

    if (completedBy) {
      this.메타데이터를_업데이트한다(completedBy);
    }
  }

  /**
   * 하향평가를 수정한다
   */
  하향평가를_수정한다(
    content?: string,
    score?: number,
    updatedBy?: string,
  ): void {
    if (content !== undefined) {
      this.downwardEvaluationContent = content;
    }
    if (score !== undefined) {
      this.downwardEvaluationScore = score;
    }

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 특정 피평가자의 평가인지 확인한다
   */
  해당_피평가자의_평가인가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 특정 평가자의 평가인지 확인한다
   */
  해당_평가자의_평가인가(evaluatorId: string): boolean {
    return this.evaluatorId === evaluatorId;
  }

  /**
   * 특정 프로젝트의 평가인지 확인한다
   */
  해당_프로젝트의_평가인가(projectId: string): boolean {
    return this.projectId === projectId;
  }

  /**
   * 특정 평가기간의 평가인지 확인한다
   */
  해당_평가기간의_평가인가(periodId: string): boolean {
    return this.periodId === periodId;
  }

  /**
   * 자기평가가 연결되어 있는지 확인한다
   */
  자기평가가_연결되어_있는가(): boolean {
    return (
      this.selfEvaluationId !== null && this.selfEvaluationId !== undefined
    );
  }

  /**
   * 자기평가를 연결한다
   */
  자기평가를_연결한다(selfEvaluationId: string, connectedBy?: string): void {
    this.selfEvaluationId = selfEvaluationId;

    if (connectedBy) {
      this.메타데이터를_업데이트한다(connectedBy);
    }
  }

  /**
   * 자기평가 연결을 해제한다
   */
  자기평가_연결을_해제한다(disconnectedBy?: string): void {
    this.selfEvaluationId = undefined;

    if (disconnectedBy) {
      this.메타데이터를_업데이트한다(disconnectedBy);
    }
  }

  /**
   * 하향평가를 삭제한다
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): DownwardEvaluationDto {
    return {
      id: this.id,
      employeeId: this.employeeId,
      evaluatorId: this.evaluatorId,
      projectId: this.projectId,
      periodId: this.periodId,
      selfEvaluationId: this.selfEvaluationId,
      downwardEvaluationContent: this.downwardEvaluationContent,
      downwardEvaluationScore: this.downwardEvaluationScore,
      evaluationDate: this.evaluationDate,
      evaluationType: this.evaluationType,
      isCompleted: this.isCompleted,
      completedAt: this.completedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      version: this.version,
    };
  }
}
