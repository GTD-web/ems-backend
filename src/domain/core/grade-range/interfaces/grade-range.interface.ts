import type {
  GradeType,
  SubGradeType,
  SubGradeInfo,
  GradeRangeDto,
  ScoreGradeMapping,
} from '../grade-range.types';
import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 등급 구간 인터페이스
 * 평가 기간별 등급 구간 설정을 관리하는 인터페이스입니다.
 */
export interface IGradeRange extends IBaseEntity {
  /** 평가 기간 ID */
  periodId: string;
  /** 등급 */
  grade: GradeType;
  /** 기준 점수 */
  score: number;
  /** 최소 범위 */
  minRange: number;
  /** 최대 범위 */
  maxRange: number;
  /** 세부 등급 정보 */
  subGrades?: SubGradeInfo[];

  /**
   * 점수가 이 등급 구간에 속하는지 확인한다
   * @param score 확인할 점수
   * @returns 구간 포함 여부
   */
  점수포함하는가(score: number): boolean;

  /**
   * 점수에 해당하는 세부 등급을 찾는다
   * @param score 확인할 점수
   * @returns 세부 등급 타입 (없으면 null)
   */
  세부등급찾는다(score: number): SubGradeType | null;

  /**
   * 점수를 최종 등급 문자열로 변환한다
   * @param score 변환할 점수
   * @returns 최종 등급 문자열 (예: S+, A-, B)
   */
  최종등급문자열변환한다(score: number): string;

  /**
   * 등급 구간 정보를 업데이트한다
   * @param score 새로운 기준 점수
   * @param minRange 새로운 최소 범위
   * @param maxRange 새로운 최대 범위
   * @param updatedBy 수정자 ID
   */
  구간정보업데이트한다(
    score?: number,
    minRange?: number,
    maxRange?: number,
    updatedBy?: string,
  ): void;

  /**
   * 세부 등급 정보를 업데이트한다
   * @param subGrades 새로운 세부 등급 정보
   * @param updatedBy 수정자 ID
   */
  세부등급정보업데이트한다(subGrades: SubGradeInfo[], updatedBy: string): void;

  /**
   * 세부 등급 정보를 추가한다
   * @param subGrade 추가할 세부 등급 정보
   * @param addedBy 추가한 사용자 ID
   */
  세부등급추가한다(subGrade: SubGradeInfo, addedBy: string): void;

  /**
   * 세부 등급 정보를 삭제한다
   * @param subGradeType 삭제할 세부 등급 타입
   * @param deletedBy 삭제한 사용자 ID
   */
  세부등급삭제한다(subGradeType: SubGradeType, deletedBy: string): void;

  /**
   * 점수 범위가 유효한지 확인한다
   * @returns 유효성 여부
   */
  점수범위유효한가(): boolean;

  /**
   * 세부 등급 범위가 유효한지 확인한다
   * @returns 유효성 여부
   */
  세부등급범위유효한가(): boolean;

  /**
   * 등급 구간이 겹치는지 확인한다
   * @param otherRange 비교할 다른 등급 구간
   * @returns 겹침 여부
   */
  구간겹치는가(otherRange: IGradeRange): boolean;

  /**
   * 세부 등급이 있는지 확인한다
   * @returns 세부 등급 존재 여부
   */
  세부등급있는가(): boolean;

  /**
   * 특정 세부 등급이 있는지 확인한다
   * @param subGradeType 확인할 세부 등급 타입
   * @returns 세부 등급 존재 여부
   */
  특정세부등급있는가(subGradeType: SubGradeType): boolean;

  /**
   * 등급 구간의 점수 범위를 가져온다
   * @returns 점수 범위 [최소, 최대]
   */
  점수범위가져온다(): [number, number];

  /**
   * 등급 구간의 중간 점수를 계산한다
   * @returns 중간 점수
   */
  중간점수계산한다(): number;

  /**
   * 점수를 등급 매핑 결과로 변환한다
   * @param score 변환할 점수
   * @returns 점수 등급 매핑 결과
   */
  점수등급매핑변환한다(score: number): ScoreGradeMapping | null;

  /**
   * 등급 구간을 DTO로 변환한다
   * @returns 등급 구간 DTO 객체
   */
  DTO변환한다(): GradeRangeDto;
}
