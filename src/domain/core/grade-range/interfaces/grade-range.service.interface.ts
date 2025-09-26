import { EntityManager } from 'typeorm';
import type {
  GradeType,
  GradeRangeFilter,
  GradeRangeStatistics,
  CreateGradeRangeDto,
  UpdateGradeRangeDto,
  ScoreGradeMapping,
} from '../grade-range.types';
import type { IGradeRange } from './grade-range.interface';

/**
 * 등급 구간 서비스 인터페이스
 */
export interface IGradeRangeService {
  /**
   * ID로 등급 구간을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IGradeRange | null>;

  /**
   * 평가 기간별 등급 구간을 조회한다
   */
  평가기간별조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<IGradeRange[]>;

  /**
   * 평가 기간과 등급으로 등급 구간을 조회한다
   */
  평가기간등급별조회한다(
    periodId: string,
    grade: GradeType,
    manager?: EntityManager,
  ): Promise<IGradeRange | null>;

  /**
   * 모든 등급 구간을 조회한다
   */
  전체조회한다(manager?: EntityManager): Promise<IGradeRange[]>;

  /**
   * 등급별 등급 구간을 조회한다
   */
  등급별조회한다(
    grade: GradeType,
    manager?: EntityManager,
  ): Promise<IGradeRange[]>;

  /**
   * 필터 조건으로 등급 구간을 조회한다
   */
  필터조회한다(
    filter: GradeRangeFilter,
    manager?: EntityManager,
  ): Promise<IGradeRange[]>;

  /**
   * 등급 구간 통계를 조회한다
   */
  통계조회한다(
    periodId?: string,
    manager?: EntityManager,
  ): Promise<GradeRangeStatistics>;

  /**
   * 점수에 해당하는 등급을 찾는다
   */
  점수로등급찾는다(
    periodId: string,
    score: number,
    manager?: EntityManager,
  ): Promise<ScoreGradeMapping | null>;

  /**
   * 여러 점수에 해당하는 등급들을 찾는다
   */
  점수목록으로등급찾는다(
    periodId: string,
    scores: number[],
    manager?: EntityManager,
  ): Promise<ScoreGradeMapping[]>;

  /**
   * 등급 구간을 생성한다
   */
  생성한다(
    createDto: CreateGradeRangeDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IGradeRange>;

  /**
   * 등급 구간을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateGradeRangeDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IGradeRange>;

  /**
   * 등급 구간을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 평가 기간의 모든 등급 구간을 삭제한다
   */
  평가기간등급구간전체삭제한다(
    periodId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 기본 등급 구간을 생성한다
   */
  기본등급구간생성한다(
    periodId: string,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IGradeRange[]>;

  /**
   * 등급 구간 겹침을 확인한다
   */
  구간겹침확인한다(
    periodId: string,
    minRange: number,
    maxRange: number,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 등급 구간 유효성을 검증한다
   */
  구간유효성검증한다(
    periodId: string,
    ranges: CreateGradeRangeDto[],
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 평가 기간의 등급 구간이 완전한지 확인한다 (모든 등급이 설정되었는지)
   */
  등급구간완전성확인한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 등급 구간을 점수 순으로 정렬하여 조회한다
   */
  점수순정렬조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<IGradeRange[]>;
}
