import type {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
  EvaluationPeriodDto,
} from '../evaluation-period.types';
import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 평가 기간 인터페이스
 * 평가 기간의 생명주기와 상태를 관리하는 인터페이스입니다.
 */
export interface IEvaluationPeriod extends IBaseEntity {
  /** 평가 기간명 */
  name: string;
  /** 평가 기간 시작일 */
  startDate: Date;
  /** 평가 기간 종료일 */
  endDate: Date;
  /** 평가 기간 설명 */
  description?: string;
  /** 평가 기간 상태 */
  status: EvaluationPeriodStatus;
  /** 현재 진행 단계 */
  currentPhase?: EvaluationPeriodPhase;
  /** 평가 기준 설정 시작일 */
  criteriaStartDate?: Date;
  /** 평가 기준 설정 종료일 */
  criteriaEndDate?: Date;
  /** 성과 입력 시작일 */
  performanceStartDate?: Date;
  /** 성과 입력 종료일 */
  performanceEndDate?: Date;
  /** 최종 평가 시작일 */
  finalEvaluationStartDate?: Date;
  /** 최종 평가 종료일 */
  finalEvaluationEndDate?: Date;
  /** 평가 완료일 */
  completedDate?: Date;
  /** 평가 기준 설정 수동 허용 여부 */
  criteriaSettingEnabled: boolean;
  /** 자기 평가 설정 수동 허용 여부 */
  selfEvaluationSettingEnabled: boolean;
  /** 하향/동료평가 설정 수동 허용 여부 */
  finalEvaluationSettingEnabled: boolean;
  /** 자기평가 달성률 최대값 (%) */
  maxSelfEvaluationRate: number;

  /**
   * 평가 기간을 시작한다
   * @param startedBy 시작한 사용자 ID
   * @throws Error 비활성 상태가 아닌 경우
   */
  평가기간시작한다(startedBy: string): void;

  /**
   * 평가 기간을 완료한다
   * @param completedBy 완료한 사용자 ID
   * @throws Error 최종 평가 상태가 아닌 경우
   */
  평가기간완료한다(completedBy: string): void;

  /**
   * 평가 기준 설정 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  평가기준설정단계이동한다(movedBy: string): void;

  /**
   * 성과 입력 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  성과입력단계이동한다(movedBy: string): void;

  /**
   * 최종 평가 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  최종평가단계이동한다(movedBy: string): void;

  /**
   * 평가 기준 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  평가기준설정수동허용활성화한다(enabledBy: string): void;

  /**
   * 자기 평가 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  자기평가설정수동허용활성화한다(enabledBy: string): void;

  /**
   * 최종 평가 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  최종평가설정수동허용활성화한다(enabledBy: string): void;

  /**
   * 자기평가 달성률 최대값을 설정한다
   * @param maxRate 최대 달성률 (%)
   * @param setBy 설정한 사용자 ID
   */
  자기평가달성률최대값설정한다(maxRate: number, setBy: string): void;

  /**
   * 현재 상태가 시작 가능한지 확인한다
   * @returns 시작 가능 여부
   */
  시작가능한가(): boolean;

  /**
   * 현재 상태가 완료 가능한지 확인한다
   * @returns 완료 가능 여부
   */
  완료가능한가(): boolean;

  /**
   * 현재 상태가 활성화된 상태인지 확인한다
   * @returns 활성화 상태 여부
   */
  활성화됨(): boolean;

  /**
   * 현재 상태가 완료된 상태인지 확인한다
   * @returns 완료 상태 여부
   */
  완료됨(): boolean;

  /**
   * 평가 기준 설정 기간인지 확인한다
   * @returns 평가 기준 설정 기간 여부
   */
  평가기준설정기간인가(): boolean;

  /**
   * 성과 입력 기간인지 확인한다
   * @returns 성과 입력 기간 여부
   */
  성과입력기간인가(): boolean;

  /**
   * 최종 평가 기간인지 확인한다
   * @returns 최종 평가 기간 여부
   */
  최종평가기간인가(): boolean;

  /**
   * 현재 날짜가 평가 기간 내인지 확인한다
   * @returns 평가 기간 내 여부
   */
  평가기간내인가(): boolean;

  /**
   * 평가 기간이 만료되었는지 확인한다
   * @returns 만료 여부
   */
  만료됨(): boolean;

  /**
   * 상태 전이가 유효한지 확인한다
   * @param targetStatus 목표 상태
   * @returns 유효한 전이 여부
   */
  상태전이유효한가(targetStatus: EvaluationPeriodStatus): boolean;

  /**
   * 단계 전이가 유효한지 확인한다
   * @param targetPhase 목표 단계
   * @returns 유효한 전이 여부
   */
  단계전이유효한가(targetPhase: EvaluationPeriodPhase): boolean;

  /**
   * 자기평가 달성률이 유효한지 확인한다
   * @param rate 확인할 달성률
   * @returns 유효성 여부
   */
  자기평가달성률유효한가(rate: number): boolean;

  /**
   * 자기평가 달성률 최대값을 반환한다
   * @returns 최대 달성률 (%)
   */
  자기평가달성률최대값(): number;

  /**
   * 평가 기간 정보를 업데이트한다
   * @param name 새로운 평가 기간명
   * @param description 새로운 설명
   * @param updatedBy 수정자 ID
   */
  정보업데이트한다(
    name?: string,
    description?: string,
    updatedBy?: string,
  ): void;

  /**
   * 평가 기간 일정을 업데이트한다
   * @param startDate 새로운 시작일
   * @param endDate 새로운 종료일
   * @param updatedBy 수정자 ID
   */
  일정업데이트한다(startDate?: Date, endDate?: Date, updatedBy?: string): void;

  /**
   * 세부 일정을 업데이트한다
   * @param criteriaStartDate 평가 기준 설정 시작일
   * @param criteriaEndDate 평가 기준 설정 종료일
   * @param performanceStartDate 성과 입력 시작일
   * @param performanceEndDate 성과 입력 종료일
   * @param finalEvaluationStartDate 최종 평가 시작일
   * @param finalEvaluationEndDate 최종 평가 종료일
   * @param updatedBy 수정자 ID
   */
  세부일정업데이트한다(
    criteriaStartDate?: Date,
    criteriaEndDate?: Date,
    performanceStartDate?: Date,
    performanceEndDate?: Date,
    finalEvaluationStartDate?: Date,
    finalEvaluationEndDate?: Date,
    updatedBy?: string,
  ): void;

  /**
   * 평가 기간을 DTO로 변환한다
   * @returns 평가 기간 DTO 객체
   */
  DTO변환한다(): EvaluationPeriodDto;
}
