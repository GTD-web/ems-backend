import {
  CreateEvaluationPeriodEmployeeMappingData,
  EvaluationPeriodEmployeeMappingFilter,
  ExcludeEvaluationTargetData,
  IncludeEvaluationTargetData,
} from './evaluation-period-employee-mapping.interface';
import { EvaluationPeriodEmployeeMappingDto } from '../evaluation-period-employee-mapping.types';

/**
 * 평가기간-직원 맵핑 서비스 인터페이스
 */
export interface IEvaluationPeriodEmployeeMappingService {
  /**
   * 평가 대상자 등록
   * - 평가기간에 직원을 평가 대상자로 등록
   * - 중복 등록 방지 (이미 등록된 경우 예외)
   */
  평가대상자를_등록한다(
    data: CreateEvaluationPeriodEmployeeMappingData,
  ): Promise<EvaluationPeriodEmployeeMappingDto>;

  /**
   * 평가 대상자 대량 등록
   * - 여러 직원을 한 번에 평가 대상자로 등록
   * - 중복된 경우 건너뜀
   */
  평가대상자를_대량_등록한다(
    evaluationPeriodId: string,
    employeeIds: string[],
    createdBy: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]>;

  /**
   * 평가 대상에서 제외
   * - 특정 직원을 평가 대상에서 제외
   * - 제외 사유 및 처리자 정보 기록
   */
  평가대상에서_제외한다(
    evaluationPeriodId: string,
    employeeId: string,
    data: ExcludeEvaluationTargetData,
  ): Promise<EvaluationPeriodEmployeeMappingDto>;

  /**
   * 평가 대상에 포함 (제외 취소)
   * - 제외되었던 직원을 다시 평가 대상에 포함
   * - 제외 관련 정보 초기화
   */
  평가대상에_포함한다(
    evaluationPeriodId: string,
    employeeId: string,
    data: IncludeEvaluationTargetData,
  ): Promise<EvaluationPeriodEmployeeMappingDto>;

  /**
   * 평가기간별 평가 대상자 목록 조회
   * - 기본적으로 제외되지 않은 대상자만 조회
   * - includeExcluded 옵션으로 제외된 대상자 포함 가능
   */
  평가기간의_평가대상자를_조회한다(
    evaluationPeriodId: string,
    includeExcluded?: boolean,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]>;

  /**
   * 평가기간의 제외된 평가 대상자 목록 조회
   */
  평가기간의_제외된_대상자를_조회한다(
    evaluationPeriodId: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]>;

  /**
   * 직원의 평가기간 맵핑 목록 조회
   * - 특정 직원이 속한 평가기간 목록
   */
  직원의_평가기간_맵핑을_조회한다(
    employeeId: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]>;

  /**
   * 평가 대상 여부 확인
   * - 특정 평가기간에 특정 직원이 평가 대상인지 확인
   * - 제외된 경우 false 반환
   */
  평가대상_여부를_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<boolean>;

  /**
   * 평가 대상자 등록 해제 (삭제)
   * - 평가기간에서 직원을 완전히 제거
   * - 제외와 다름 (제외는 기록 유지, 삭제는 소프트 삭제)
   */
  평가대상자_등록을_해제한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<boolean>;

  /**
   * 평가기간의 모든 평가 대상자 등록 해제
   * - 평가기간 삭제 시 사용
   */
  평가기간의_모든_대상자를_해제한다(
    evaluationPeriodId: string,
  ): Promise<number>;

  /**
   * 필터 조건으로 평가 대상자 조회
   */
  필터로_평가대상자를_조회한다(
    filter: EvaluationPeriodEmployeeMappingFilter,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]>;
}
