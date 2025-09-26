import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 동료 평가 상태
 */
export enum PeerEvaluationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/**
 * 동료 평가 인터페이스
 * 동료 평가 데이터를 관리하는 인터페이스입니다.
 * 피평가자, 평가자, 평가기간과의 관계는 별도의 맵핑 엔티티에서 관리됩니다.
 */
export interface IPeerEvaluation extends IBaseEntity {
  /** 평가 내용 */
  evaluationContent?: string;
  /** 평가 점수 */
  score?: number;
  /** 평가일 */
  evaluationDate: Date;
  /** 평가 상태 */
  status: PeerEvaluationStatus;

  /**
   * 평가 내용을 업데이트한다
   * @param content 새로운 평가 내용
   * @param updatedBy 수정자 ID
   */
  평가내용업데이트한다(content: string, updatedBy: string): void;

  /**
   * 평가 점수를 업데이트한다
   * @param score 새로운 평가 점수
   * @param updatedBy 수정자 ID
   */
  평가점수업데이트한다(score: number, updatedBy: string): void;

  /**
   * 평가를 시작한다
   * @param startedBy 시작한 사용자 ID
   */
  평가시작한다(startedBy: string): void;

  /**
   * 평가를 완료한다
   * @param completedBy 완료한 사용자 ID
   */
  평가완료한다(completedBy: string): void;

  /**
   * 평가 상태를 변경한다
   * @param status 새로운 상태
   * @param changedBy 변경한 사용자 ID
   */
  상태변경한다(status: PeerEvaluationStatus, changedBy: string): void;

  /**
   * 평가가 완료되었는지 확인한다
   * @returns 완료 여부
   */
  평가완료됨(): boolean;

  /**
   * 평가가 진행중인지 확인한다
   * @returns 진행중 여부
   */
  평가진행중인가(): boolean;

  /**
   * 평가가 대기중인지 확인한다
   * @returns 대기중 여부
   */
  평가대기중인가(): boolean;

  /**
   * 평가 점수가 유효한지 확인한다
   * @returns 유효성 여부
   */
  점수유효한가(): boolean;

  /**
   * 평가 수정이 가능한지 확인한다
   * @returns 수정 가능 여부
   */
  수정가능한가(): boolean;
}
