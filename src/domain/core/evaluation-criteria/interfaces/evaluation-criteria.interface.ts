import type { EvaluationCriteriaDto } from '../evaluation-criteria.types';
import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 평가 기준 인터페이스
 * 템플릿에 포함되는 구체적인 평가 기준을 관리하는 인터페이스입니다.
 */
export interface IEvaluationCriteria extends IBaseEntity {
  /** 템플릿 ID */
  templateId: string;
  /** 평가 기준명 */
  name: string;
  /** 평가 기준 설명 */
  description?: string;
  /** 가중치 (%) */
  weight: number;
  /** 최소 점수 */
  minScore: number;
  /** 최대 점수 */
  maxScore: number;
  /** 점수별 라벨 배열 */
  scoreLabels?: Record<number, string>;

  /**
   * 평가 기준 정보를 업데이트한다
   * @param name 새로운 평가 기준명
   * @param description 새로운 설명
   * @param updatedBy 수정자 ID
   */
  정보업데이트한다(
    name?: string,
    description?: string,
    updatedBy?: string,
  ): void;

  /**
   * 가중치를 업데이트한다
   * @param weight 새로운 가중치
   * @param updatedBy 수정자 ID
   */
  가중치업데이트한다(weight: number, updatedBy: string): void;

  /**
   * 점수 범위를 업데이트한다
   * @param minScore 새로운 최소 점수
   * @param maxScore 새로운 최대 점수
   * @param updatedBy 수정자 ID
   */
  점수범위업데이트한다(
    minScore: number,
    maxScore: number,
    updatedBy: string,
  ): void;

  /**
   * 점수 라벨을 업데이트한다
   * @param scoreLabels 새로운 점수 라벨
   * @param updatedBy 수정자 ID
   */
  점수라벨업데이트한다(
    scoreLabels: Record<number, string>,
    updatedBy: string,
  ): void;

  /**
   * 가중치가 유효한지 확인한다
   * @returns 유효성 여부
   */
  가중치유효한가(): boolean;

  /**
   * 점수 범위가 유효한지 확인한다
   * @returns 유효성 여부
   */
  점수범위유효한가(): boolean;

  /**
   * 특정 점수가 범위 내인지 확인한다
   * @param score 확인할 점수
   * @returns 범위 내 여부
   */
  점수범위내인가(score: number): boolean;

  /**
   * 점수 라벨이 있는지 확인한다
   * @returns 라벨 존재 여부
   */
  점수라벨있는가(): boolean;

  /**
   * 특정 점수의 라벨을 가져온다
   * @param score 점수
   * @returns 라벨 문자열
   */
  점수라벨가져온다(score: number): string | undefined;

  /**
   * 평가 기준 설명이 있는지 확인한다
   * @returns 설명 존재 여부
   */
  설명있는가(): boolean;

  /**
   * 특정 템플릿에 속하는지 확인한다
   * @param templateId 확인할 템플릿 ID
   * @returns 템플릿 일치 여부
   */
  템플릿일치하는가(templateId: string): boolean;

  /**
   * 점수 범위를 계산한다
   * @returns 점수 범위 (최대 - 최소)
   */
  점수범위계산한다(): number;

  /**
   * 평가 기준을 복사한다
   * @param newTemplateId 새로운 템플릿 ID
   * @param copiedBy 복사한 사용자 ID
   * @returns 복사된 평가 기준 정보
   */
  평가기준복사한다(
    newTemplateId: string,
    copiedBy: string,
  ): Partial<IEvaluationCriteria>;

  /**
   * 평가 기준을 DTO로 변환한다
   * @returns 평가 기준 DTO 객체
   */
  DTO변환한다(): EvaluationCriteriaDto;
}
