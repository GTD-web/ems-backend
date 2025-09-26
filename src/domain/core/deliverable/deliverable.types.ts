import { DeliverableType } from './interfaces/deliverable.interface';

/**
 * 산출물 생성 DTO
 * 실제 산출물 데이터만 포함합니다.
 */
export interface CreateDeliverableDto {
  /** 산출물 유형 */
  type: DeliverableType;
  /** 산출물 제목 */
  title: string;
  /** 산출물 경로 */
  path: string;
}

/**
 * 산출물 업데이트 DTO
 */
export interface UpdateDeliverableDto {
  /** 산출물 유형 */
  type?: DeliverableType;
  /** 산출물 제목 */
  title?: string;
  /** 산출물 경로 */
  path?: string;
}

/**
 * 산출물 DTO
 * 실제 산출물 데이터만 포함합니다.
 */
export interface DeliverableDto {
  /** 산출물 고유 식별자 */
  id: string;
  /** 산출물 유형 */
  type: DeliverableType;
  /** 산출물 제목 */
  title: string;
  /** 산출물 경로 */
  path: string;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 산출물 필터
 * 실제 산출물 데이터 기준 필터입니다.
 */
export interface DeliverableFilter {
  /** 산출물 유형 */
  type?: DeliverableType;
  /** 제목 검색 */
  titleSearch?: string;
  /** 경로 검색 */
  pathSearch?: string;
}
