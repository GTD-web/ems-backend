import { EntityManager } from 'typeorm';
import type { IQuestionGroupMapping } from './question-group-mapping.interface';
import type {
  CreateQuestionGroupMappingDto,
  UpdateQuestionGroupMappingDto,
  QuestionGroupMappingFilter,
} from '../question-group-mapping.types';

/**
 * 질문 그룹 매핑 서비스 인터페이스
 */
export interface IQuestionGroupMappingService {
  /**
   * ID로 질문 그룹 매핑을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroupMapping | null>;

  /**
   * 그룹 ID로 질문 그룹 매핑들을 조회한다
   */
  그룹ID로조회한다(
    groupId: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroupMapping[]>;

  /**
   * 질문 ID로 질문 그룹 매핑들을 조회한다
   */
  질문ID로조회한다(
    questionId: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroupMapping[]>;

  /**
   * 그룹 ID와 질문 ID로 매핑을 조회한다
   */
  그룹질문으로조회한다(
    groupId: string,
    questionId: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroupMapping | null>;

  /**
   * 필터 조건으로 질문 그룹 매핑을 조회한다
   */
  필터조회한다(
    filter: QuestionGroupMappingFilter,
    manager?: EntityManager,
  ): Promise<IQuestionGroupMapping[]>;

  /**
   * 질문 그룹 매핑을 생성한다
   */
  생성한다(
    createDto: CreateQuestionGroupMappingDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroupMapping>;

  /**
   * 질문 그룹 매핑을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateQuestionGroupMappingDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IQuestionGroupMapping>;

  /**
   * 질문 그룹 매핑을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 그룹의 모든 매핑을 삭제한다
   */
  그룹매핑전체삭제한다(
    groupId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 질문의 모든 매핑을 삭제한다
   */
  질문매핑전체삭제한다(
    questionId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 매핑 중복을 확인한다
   */
  매핑중복확인한다(
    groupId: string,
    questionId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 그룹 내 질문 개수를 조회한다
   */
  그룹내질문개수조회한다(
    groupId: string,
    manager?: EntityManager,
  ): Promise<number>;

  /**
   * 질문이 속한 그룹 개수를 조회한다
   */
  질문의그룹개수조회한다(
    questionId: string,
    manager?: EntityManager,
  ): Promise<number>;
}

