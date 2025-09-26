import { EntityManager } from 'typeorm';
import type { IQuestionGroup } from './question-group.interface';
import type {
  CreateQuestionGroupDto,
  UpdateQuestionGroupDto,
  QuestionGroupFilter,
} from '../question-group.types';

/**
 * 질문 그룹 서비스 인터페이스
 */
export interface IQuestionGroupService {
  /**
   * ID로 질문 그룹을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroup | null>;

  /**
   * 그룹명으로 질문 그룹을 조회한다
   */
  그룹명으로조회한다(
    name: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroup | null>;

  /**
   * 기본 그룹을 조회한다
   */
  기본그룹조회한다(manager?: EntityManager): Promise<IQuestionGroup | null>;

  /**
   * 모든 질문 그룹을 조회한다
   */
  전체조회한다(manager?: EntityManager): Promise<IQuestionGroup[]>;

  /**
   * 필터 조건으로 질문 그룹을 조회한다
   */
  필터조회한다(
    filter: QuestionGroupFilter,
    manager?: EntityManager,
  ): Promise<IQuestionGroup[]>;

  /**
   * 삭제 가능한 그룹들을 조회한다
   */
  삭제가능그룹조회한다(manager?: EntityManager): Promise<IQuestionGroup[]>;

  /**
   * 질문 그룹을 생성한다
   */
  생성한다(
    createDto: CreateQuestionGroupDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroup>;

  /**
   * 질문 그룹을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateQuestionGroupDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroup>;

  /**
   * 질문 그룹을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 그룹명 중복을 확인한다
   */
  그룹명중복확인한다(
    name: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 그룹에 질문이 있는지 확인한다
   */
  그룹내질문존재확인한다(
    groupId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 그룹의 질문 개수를 조회한다
   */
  그룹내질문개수조회한다(
    groupId: string,
    manager?: EntityManager,
  ): Promise<number>;

  /**
   * 기본 그룹을 설정한다 (기존 기본 그룹은 해제)
   */
  기본그룹설정한다(
    groupId: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<void>;
}
