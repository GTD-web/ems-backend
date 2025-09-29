import type {
  EvaluationStatus,
  FinalGrade,
  JobGrade,
  EmployeeEvaluationStatusDto,
} from '../employee-evaluation-status.types';
import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 직원 평가 상태 인터페이스
 * 직원별 평가 진행 상태를 관리하는 인터페이스입니다.
 * 직원과 평가기간과의 관계는 별도의 맵핑 엔티티에서 관리됩니다.
 */
export interface IEmployeeEvaluationStatus extends IBaseEntity {
  /** 평가 제외 여부 */
  isExcluded: boolean;
  /** 평가 항목 설정 완료 */
  evaluationItems: boolean;
  /** 평가 기준 설정 완료 */
  evaluationCriteria: boolean;
  /** 평가 라인 설정 완료 */
  evaluationLine: boolean;
  /** 성과 입력 상태 */
  performanceInput: EvaluationStatus;
  /** 자기 평가 상태 */
  selfEvaluation: EvaluationStatus;
  /** 자기 평가 점수 */
  selfEvaluationScore?: number;
  /** 1차 평가 상태 */
  firstEvaluation: EvaluationStatus;
  /** 1차 평가 점수 */
  firstEvaluationScore?: number;
  /** 2차 평가 상태 */
  secondEvaluation: EvaluationStatus;
  /** 2차 평가 점수 */
  secondEvaluationScore?: number;
  /** 동료 평가 상태 */
  peerEvaluation: EvaluationStatus;
  /** 동료 평가 점수 */
  peerEvaluationScore?: number;
  /** 최종 승인 여부 */
  finalApproval: boolean;
  /** 최종 등급 */
  finalGrade?: FinalGrade;
  /** 직무 등급 */
  jobGrade?: JobGrade;
  /** 자기 평가 수동 허용 */
  selfEvaluationManuallyEnabled: boolean;
  /** 하향 평가 수동 허용 */
  downwardEvaluationManuallyEnabled: boolean;

  /**
   * 평가에서 제외한다
   * @param excludedBy 제외한 사용자 ID
   */
  평가제외한다(excludedBy: string): void;

  /**
   * 평가 제외를 해제한다
   * @param includedBy 포함한 사용자 ID
   */
  평가제외해제한다(includedBy: string): void;

  /**
   * 평가 항목 설정을 완료한다
   * @param completedBy 완료한 사용자 ID
   */
  평가항목설정완료한다(completedBy: string): void;

  /**
   * 평가 기준 설정을 완료한다
   * @param completedBy 완료한 사용자 ID
   */
  평가기준설정완료한다(completedBy: string): void;

  /**
   * 평가 라인 설정을 완료한다
   * @param completedBy 완료한 사용자 ID
   */
  평가라인설정완료한다(completedBy: string): void;

  /**
   * 성과 입력 상태를 업데이트한다
   * @param status 새로운 상태
   * @param updatedBy 수정자 ID
   */
  성과입력상태업데이트한다(status: EvaluationStatus, updatedBy: string): void;

  /**
   * 자기 평가 상태를 업데이트한다
   * @param status 새로운 상태
   * @param score 평가 점수
   * @param updatedBy 수정자 ID
   */
  자기평가상태업데이트한다(
    status: EvaluationStatus,
    score?: number,
    updatedBy?: string,
  ): void;

  /**
   * 1차 평가 상태를 업데이트한다
   * @param status 새로운 상태
   * @param score 평가 점수
   * @param updatedBy 수정자 ID
   */
  일차평가상태업데이트한다(
    status: EvaluationStatus,
    score?: number,
    updatedBy?: string,
  ): void;

  /**
   * 2차 평가 상태를 업데이트한다
   * @param status 새로운 상태
   * @param score 평가 점수
   * @param updatedBy 수정자 ID
   */
  이차평가상태업데이트한다(
    status: EvaluationStatus,
    score?: number,
    updatedBy?: string,
  ): void;

  /**
   * 동료 평가 상태를 업데이트한다
   * @param status 새로운 상태
   * @param score 평가 점수
   * @param updatedBy 수정자 ID
   */
  동료평가상태업데이트한다(
    status: EvaluationStatus,
    score?: number,
    updatedBy?: string,
  ): void;

  /**
   * 추가 평가 상태를 업데이트한다
   * @param status 새로운 상태
   * @param score 평가 점수
   * @param updatedBy 수정자 ID
   */
  추가평가상태업데이트한다(
    status: EvaluationStatus,
    score?: number,
    updatedBy?: string,
  ): void;

  /**
   * 최종 등급을 설정한다
   * @param grade 최종 등급
   * @param setBy 설정한 사용자 ID
   */
  최종등급설정한다(grade: FinalGrade, setBy: string): void;

  /**
   * 직무 등급을 설정한다
   * @param grade 직무 등급
   * @param setBy 설정한 사용자 ID
   */
  직무등급설정한다(grade: JobGrade, setBy: string): void;

  /**
   * 최종 승인한다
   * @param approvedBy 승인한 사용자 ID
   */
  최종승인한다(approvedBy: string): void;

  /**
   * 최종 승인을 취소한다
   * @param cancelledBy 취소한 사용자 ID
   */
  최종승인취소한다(cancelledBy: string): void;

  /**
   * 자기 평가 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  자기평가수동허용활성화한다(enabledBy: string): void;

  /**
   * 하향 평가 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  하향평가수동허용활성화한다(enabledBy: string): void;

  /**
   * 평가가 제외되었는지 확인한다
   * @returns 제외 여부
   */
  평가제외됨(): boolean;

  /**
   * 모든 설정이 완료되었는지 확인한다
   * @returns 설정 완료 여부
   */
  설정완료됨(): boolean;

  /**
   * 모든 평가가 완료되었는지 확인한다
   * @returns 평가 완료 여부
   */
  평가완료됨(): boolean;

  /**
   * 최종 승인되었는지 확인한다
   * @returns 승인 여부
   */
  최종승인됨(): boolean;

  /**
   * 특정 평가 유형이 완료되었는지 확인한다
   * @param evaluationType 평가 유형
   * @returns 완료 여부
   */
  평가유형완료됨(evaluationType: string): boolean;

  /**
   * 평가 진행률을 계산한다
   * @returns 진행률 (0-100)
   */
  평가진행률계산한다(): number;

  /**
   * 평균 점수를 계산한다
   * @returns 평균 점수
   */
  평균점수계산한다(): number;

  /**
   * 직원 평가 상태를 DTO로 변환한다
   * @returns 직원 평가 상태 DTO 객체
   */
  DTO변환한다(): EmployeeEvaluationStatusDto;
}
