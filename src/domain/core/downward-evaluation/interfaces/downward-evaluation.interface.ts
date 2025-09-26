import type {
  DownwardEvaluationType,
  DownwardEvaluationDto,
} from '../downward-evaluation.types';
import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 하향 평가 인터페이스
 * 1차, 2차 평가 데이터를 관리하는 인터페이스입니다.
 * 자기평가 내용과 점수는 별도의 WBS 자기평가에서 관리됩니다.
 * 피평가자, 평가자, 프로젝트, 평가기간과의 관계는 별도의 맵핑 엔티티에서 관리됩니다.
 */
export interface IDownwardEvaluation extends IBaseEntity {
  /** 하향평가 내용 */
  downwardEvaluationContent?: string;
  /** 하향평가 점수 */
  downwardEvaluationScore?: number;
  /** 평가일 */
  evaluationDate: Date;
  /** 평가 유형 */
  evaluationType: DownwardEvaluationType;

  /**
   * 하향평가 내용을 업데이트한다
   * @param content 새로운 하향평가 내용
   * @param updatedBy 수정자 ID
   */
  하향평가내용업데이트한다(content: string, updatedBy: string): void;

  /**
   * 하향평가 점수를 업데이트한다
   * @param score 새로운 하향평가 점수
   * @param updatedBy 수정자 ID
   */
  하향평가점수업데이트한다(score: number, updatedBy: string): void;

  /**
   * 평가를 완료한다
   * @param completedBy 완료한 사용자 ID
   */
  평가완료한다(completedBy: string): void;

  /**
   * 1차 평가인지 확인한다
   * @returns 1차 평가 여부
   */
  일차평가인가(): boolean;

  /**
   * 2차 평가인지 확인한다
   * @returns 2차 평가 여부
   */
  이차평가인가(): boolean;

  /**
   * 하향평가가 완료되었는지 확인한다
   * @returns 하향평가 완료 여부
   */
  하향평가완료됨(): boolean;

  /**
   * 전체 평가가 완료되었는지 확인한다
   * @returns 전체 평가 완료 여부
   */
  평가완료됨(): boolean;

  /**
   * 하향평가 점수가 유효한지 확인한다
   * @returns 유효성 여부
   */
  하향평가점수유효한가(): boolean;

  /**
   * 하향평가 내용이 있는지 확인한다
   * @returns 내용 존재 여부
   */
  하향평가내용있는가(): boolean;

  /**
   * 평가 수정이 가능한지 확인한다
   * @returns 수정 가능 여부
   */
  수정가능한가(): boolean;

  /**
   * 하향 평가를 DTO로 변환한다
   * @returns 하향 평가 DTO 객체
   */
  DTO변환한다(): DownwardEvaluationDto;
}
