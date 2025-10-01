import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IPeerEvaluationMapping } from './interfaces/peer-evaluation-mapping.interface';
import type {
  PeerEvaluationMappingDto,
  CreatePeerEvaluationMappingData,
} from './peer-evaluation-mapping.types';

/**
 * 동료평가 매핑 엔티티
 * 피평가자, 평가자, 평가기간, 동료평가 간의 매핑을 관리합니다.
 */
@Entity('peer_evaluation_mapping')
@Index(['employeeId'])
@Index(['evaluatorId'])
@Index(['periodId'])
@Index(['peerEvaluationId'])
@Index(['employeeId', 'evaluatorId', 'periodId'])
export class PeerEvaluationMapping
  extends BaseEntity<PeerEvaluationMappingDto>
  implements IPeerEvaluationMapping
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
    comment: '평가 기간 ID',
  })
  periodId: string;

  @Column({
    type: 'uuid',
    comment: '동료평가 ID',
  })
  peerEvaluationId: string;

  @Column({
    type: 'timestamp with time zone',
    comment: '매핑일',
  })
  mappedDate: Date;

  @Column({
    type: 'uuid',
    comment: '매핑자 ID',
  })
  mappedBy: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: '활성 상태',
  })
  isActive: boolean;

  constructor(data?: CreatePeerEvaluationMappingData) {
    super();
    if (data) {
      this.employeeId = data.employeeId;
      this.evaluatorId = data.evaluatorId;
      this.periodId = data.periodId;
      this.peerEvaluationId = data.peerEvaluationId;
      this.mappedBy = data.mappedBy;
      this.mappedDate = new Date();
      this.isActive = true;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.mappedBy);
    }
  }

  /**
   * 특정 피평가자의 매핑인지 확인한다
   */
  해당_피평가자의_매핑인가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 특정 평가자의 매핑인지 확인한다
   */
  해당_평가자의_매핑인가(evaluatorId: string): boolean {
    return this.evaluatorId === evaluatorId;
  }

  /**
   * 특정 평가기간의 매핑인지 확인한다
   */
  해당_평가기간의_매핑인가(periodId: string): boolean {
    return this.periodId === periodId;
  }

  /**
   * 자기 자신을 평가하는 매핑인지 확인한다
   */
  자기_자신을_평가하는_매핑인가(): boolean {
    return this.employeeId === this.evaluatorId;
  }

  /**
   * 매핑을 활성화한다
   */
  활성화한다(activatedBy?: string): void {
    this.isActive = true;

    if (activatedBy) {
      this.메타데이터를_업데이트한다(activatedBy);
    }
  }

  /**
   * 매핑을 비활성화한다
   */
  비활성화한다(deactivatedBy?: string): void {
    this.isActive = false;

    if (deactivatedBy) {
      this.메타데이터를_업데이트한다(deactivatedBy);
    }
  }

  /**
   * 매핑을 삭제한다
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): PeerEvaluationMappingDto {
    return {
      id: this.id,
      employeeId: this.employeeId,
      evaluatorId: this.evaluatorId,
      periodId: this.periodId,
      peerEvaluationId: this.peerEvaluationId,
      mappedDate: this.mappedDate,
      mappedBy: this.mappedBy,
      isActive: this.isActive,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      version: this.version,
    };
  }
}
