import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { QuestionGroup } from './question-group.entity';
import {
  QuestionGroupNotFoundException,
  DuplicateQuestionGroupException,
  DefaultGroupDeletionException,
  UndeletableGroupException,
  GroupWithQuestionsException,
} from './question-group.exceptions';
import type {
  CreateQuestionGroupDto,
  UpdateQuestionGroupDto,
  QuestionGroupFilter,
} from './question-group.types';
import type { IQuestionGroupService } from './interfaces/question-group.service.interface';

/**
 * 질문 그룹 서비스
 * 질문 그룹 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class QuestionGroupService implements IQuestionGroupService {
  private readonly logger = new Logger(QuestionGroupService.name);

  constructor(
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
  ) {}

  /**
   * ID로 질문 그룹을 조회한다
   */
  async ID로조회한다(id: string): Promise<QuestionGroup | null> {
    this.logger.log(`질문 그룹 조회 - ID: ${id}`);
    return await this.questionGroupRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * 그룹명으로 질문 그룹을 조회한다
   */
  async 그룹명으로조회한다(name: string): Promise<QuestionGroup | null> {
    this.logger.log(`질문 그룹 조회 - 그룹명: ${name}`);
    return await this.questionGroupRepository.findOne({
      where: { name, deletedAt: IsNull() },
    });
  }

  /**
   * 기본 그룹을 조회한다
   */
  async 기본그룹조회한다(): Promise<QuestionGroup | null> {
    this.logger.log('기본 그룹 조회');
    return await this.questionGroupRepository.findOne({
      where: { isDefault: true, deletedAt: IsNull() },
    });
  }

  /**
   * 모든 질문 그룹을 조회한다
   */
  async 전체조회한다(): Promise<QuestionGroup[]> {
    this.logger.log('전체 질문 그룹 조회');
    return await this.questionGroupRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 필터 조건으로 질문 그룹을 조회한다
   */
  async 필터조회한다(filter: QuestionGroupFilter): Promise<QuestionGroup[]> {
    this.logger.log('필터 조건으로 질문 그룹 조회', filter);

    const queryBuilder = this.questionGroupRepository
      .createQueryBuilder('group')
      .where('group.deletedAt IS NULL');

    if (filter.nameSearch) {
      queryBuilder.andWhere('group.name LIKE :nameSearch', {
        nameSearch: `%${filter.nameSearch}%`,
      });
    }

    if (filter.isDefault !== undefined) {
      queryBuilder.andWhere('group.isDefault = :isDefault', {
        isDefault: filter.isDefault,
      });
    }

    if (filter.isDeletable !== undefined) {
      queryBuilder.andWhere('group.isDeletable = :isDeletable', {
        isDeletable: filter.isDeletable,
      });
    }

    queryBuilder.orderBy('group.createdAt', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * 삭제 가능한 그룹들을 조회한다
   */
  async 삭제가능그룹조회한다(): Promise<QuestionGroup[]> {
    this.logger.log('삭제 가능한 그룹 조회');
    return await this.questionGroupRepository.find({
      where: { isDeletable: true, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 질문 그룹을 생성한다
   */
  async 생성한다(
    createDto: CreateQuestionGroupDto,
    createdBy: string,
  ): Promise<QuestionGroup> {
    this.logger.log(`질문 그룹 생성 시작 - 그룹명: ${createDto.name}`);

    // 그룹명 중복 검사
    const exists = await this.그룹명중복확인한다(createDto.name);
    if (exists) {
      throw new DuplicateQuestionGroupException(createDto.name);
    }

    try {
      const questionGroup = new QuestionGroup({ ...createDto, createdBy });
      const saved = await this.questionGroupRepository.save(questionGroup);

      this.logger.log(`질문 그룹 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `질문 그룹 생성 실패 - 그룹명: ${createDto.name}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 질문 그룹을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateDto: UpdateQuestionGroupDto,
    updatedBy: string,
  ): Promise<QuestionGroup> {
    this.logger.log(`질문 그룹 수정 시작 - ID: ${id}`);

    const questionGroup = await this.ID로조회한다(id);
    if (!questionGroup) {
      throw new QuestionGroupNotFoundException(id);
    }

    // 그룹명 변경 시 중복 검사
    if (updateDto.name && updateDto.name !== questionGroup.name) {
      const exists = await this.그룹명중복확인한다(updateDto.name, id);
      if (exists) {
        throw new DuplicateQuestionGroupException(updateDto.name);
      }
    }

    try {
      if (updateDto.name) {
        questionGroup.그룹명업데이트한다(updateDto.name, updatedBy);
      }

      if (updateDto.isDefault !== undefined) {
        questionGroup.기본그룹설정한다(updateDto.isDefault, updatedBy);
      }

      if (updateDto.isDeletable !== undefined) {
        questionGroup.삭제가능여부설정한다(updateDto.isDeletable, updatedBy);
      }

      const saved = await this.questionGroupRepository.save(questionGroup);
      this.logger.log(`질문 그룹 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`질문 그룹 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 질문 그룹을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`질문 그룹 삭제 시작 - ID: ${id}`);

    const questionGroup = await this.ID로조회한다(id);
    if (!questionGroup) {
      throw new QuestionGroupNotFoundException(id);
    }

    // 기본 그룹 삭제 방지
    if (questionGroup.기본그룹인가()) {
      throw new DefaultGroupDeletionException(id);
    }

    // 삭제 불가능한 그룹 삭제 방지
    if (!questionGroup.삭제가능한가()) {
      throw new UndeletableGroupException(id);
    }

    try {
      questionGroup.deletedAt = new Date();
      questionGroup.메타데이터를_업데이트한다(deletedBy);
      await this.questionGroupRepository.save(questionGroup);

      this.logger.log(`질문 그룹 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`질문 그룹 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 그룹명 중복을 확인한다
   */
  async 그룹명중복확인한다(name: string, excludeId?: string): Promise<boolean> {
    const queryBuilder = this.questionGroupRepository
      .createQueryBuilder('group')
      .where('group.name = :name', { name })
      .andWhere('group.deletedAt IS NULL');

    if (excludeId) {
      queryBuilder.andWhere('group.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 그룹에 질문이 있는지 확인한다
   */
  async 그룹내질문존재확인한다(groupId: string): Promise<boolean> {
    // QuestionGroupMapping을 통해 확인 필요
    // 현재는 간단하게 false 반환
    return false;
  }

  /**
   * 그룹의 질문 개수를 조회한다
   */
  async 그룹내질문개수조회한다(groupId: string): Promise<number> {
    // QuestionGroupMapping을 통해 확인 필요
    // 현재는 0 반환
    return 0;
  }

  /**
   * 기본 그룹을 설정한다 (기존 기본 그룹은 해제)
   */
  async 기본그룹설정한다(groupId: string, updatedBy: string): Promise<void> {
    this.logger.log(`기본 그룹 설정 - ID: ${groupId}`);

    const questionGroup = await this.ID로조회한다(groupId);
    if (!questionGroup) {
      throw new QuestionGroupNotFoundException(groupId);
    }

    try {
      // 기존 기본 그룹 해제
      const currentDefault = await this.기본그룹조회한다();
      if (currentDefault && currentDefault.id !== groupId) {
        currentDefault.기본그룹설정한다(false, updatedBy);
        await this.questionGroupRepository.save(currentDefault);
      }

      // 새 기본 그룹 설정
      questionGroup.기본그룹설정한다(true, updatedBy);
      await this.questionGroupRepository.save(questionGroup);

      this.logger.log(`기본 그룹 설정 완료 - ID: ${groupId}`);
    } catch (error) {
      this.logger.error(`기본 그룹 설정 실패 - ID: ${groupId}`, error.stack);
      throw error;
    }
  }
}
