import type {
  JobGrade,
  JobDetailedGrade,
  FinalEvaluationDto,
} from '../final-evaluation.types';
import type { IBaseEntity } from '@libs/database/base/base.entity';

// 서비스 인터페이스 export
export * from './final-evaluation-service.interface';

/**
 * 최종평가 인터페이스
 * 직원의 평가 기간에 대한 최종 평가 결과를 정의하는 인터페이스입니다.
 *
 * 최종평가는 자기평가, 동료평가, 하향평가 등을 종합하여
 * 최종적인 평가 등급과 직무 등급을 결정합니다.
 */
export interface IFinalEvaluation extends IBaseEntity {
  /** 피평가자(직원) ID */
  employeeId: string;

  /** 평가기간 ID */
  periodId: string;

  /** 평가등급 (문자열, 예: S, A, B, C, D 등) */
  evaluationGrade: string;

  /** 직무등급 */
  jobGrade: JobGrade;

  /** 직무 상세등급 */
  jobDetailedGrade: JobDetailedGrade;

  /** 최종 평가 의견/코멘트 */
  finalComments?: string;

  /** 확정 여부 */
  isConfirmed: boolean;

  /** 확정일시 */
  confirmedAt?: Date | null;

  /** 확정자 ID */
  confirmedBy?: string | null;

  /**
   * DTO로 변환
   */
  DTO로_변환한다(): FinalEvaluationDto;

  /**
   * 평가등급을 변경한다
   */
  평가등급을_변경한다(evaluationGrade: string, updatedBy?: string): void;

  /**
   * 직무등급을 변경한다
   */
  직무등급을_변경한다(jobGrade: JobGrade, updatedBy?: string): void;

  /**
   * 직무 상세등급을 변경한다
   */
  직무_상세등급을_변경한다(
    jobDetailedGrade: JobDetailedGrade,
    updatedBy?: string,
  ): void;

  /**
   * 최종 평가 의견을 변경한다
   */
  최종_평가_의견을_변경한다(finalComments: string, updatedBy?: string): void;

  /**
   * 평가를 확정한다
   */
  평가를_확정한다(confirmedBy: string): void;

  /**
   * 평가 확정을 취소한다
   */
  평가_확정을_취소한다(updatedBy: string): void;

  /**
   * 최종평가가 확정되었는지 확인한다
   */
  확정되었는가(): boolean;

  /**
   * 최종평가가 수정 가능한지 확인한다
   */
  수정_가능한가(): boolean;

  /**
   * 최종평가가 유효한지 검증한다
   */
  유효성을_검증한다(): boolean;
}
