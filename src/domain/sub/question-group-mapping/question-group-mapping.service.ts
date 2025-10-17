import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { QuestionGroupMapping } from './question-group-mapping.entity';
import {
  QuestionGroupMappingNotFoundException,
  DuplicateQuestionGroupMappingException,
} from './question-group-mapping.exceptions';
import type {
  CreateQuestionGroupMappingDto,
  UpdateQuestionGroupMappingDto,
  QuestionGroupMappingFilter,
} from './question-group-mapping.types';
import type { IQuestionGroupMappingService } from './interfaces/question-group-mapping.service.interface';

/**
 * 질문 그룹 매핑 서비스
 * 질문과 그룹의 N:M 관계를 관리합니다.
 */
@Injectable()
export class QuestionGroupMappingService
  implements IQuestionGroupMappingService
{
  private readonly logger = new Logger(QuestionGroupMappingService.name);

  constructor(
    @InjectRepository(QuestionGroupMapping)
    private readonly mappingRepository: Repository<QuestionGroupMapping>,
  ) {}

  /**
   * ID로 질문 그룹 매핑을 조회한다
   */
  async ID로조회한다(id: string): Promise<QuestionGroupMapping | null> {
    this.logger.log(`질문 그룹 매핑 조회 - ID: ${id}`);
    return await this.mappingRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * 그룹 ID로 질문 그룹 매핑들을 조회한다 (질문 정보 포함)
   */
  async 그룹ID로조회한다(groupId: string): Promise<QuestionGroupMapping[]> {
    this.logger.log(`질문 그룹 매핑 조회 - 그룹 ID: ${groupId}`);
    return await this.mappingRepository
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.question', 'question')
      .where('mapping.groupId = :groupId', { groupId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('question.deletedAt IS NULL')
      .orderBy('mapping.displayOrder', 'ASC')
      .getMany();
  }

  /**
   * 질문 ID로 질문 그룹 매핑들을 조회한다 (그룹 정보 포함)
   */
  async 질문ID로조회한다(questionId: string): Promise<QuestionGroupMapping[]> {
    this.logger.log(`질문 그룹 매핑 조회 - 질문 ID: ${questionId}`);
    return await this.mappingRepository
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.group', 'group')
      .where('mapping.questionId = :questionId', { questionId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('group.deletedAt IS NULL')
      .orderBy('mapping.displayOrder', 'ASC')
      .getMany();
  }

  /**
   * 그룹 ID와 질문 ID로 매핑을 조회한다
   */
  async 그룹질문으로조회한다(
    groupId: string,
    questionId: string,
  ): Promise<QuestionGroupMapping | null> {
    this.logger.log(
      `질문 그룹 매핑 조회 - 그룹 ID: ${groupId}, 질문 ID: ${questionId}`,
    );
    return await this.mappingRepository.findOne({
      where: { groupId, questionId, deletedAt: IsNull() },
    });
  }

  /**
   * 필터 조건으로 질문 그룹 매핑을 조회한다
   */
  async 필터조회한다(
    filter: QuestionGroupMappingFilter,
  ): Promise<QuestionGroupMapping[]> {
    this.logger.log('필터 조건으로 질문 그룹 매핑 조회', filter);

    const queryBuilder = this.mappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.deletedAt IS NULL');

    if (filter.groupId) {
      queryBuilder.andWhere('mapping.groupId = :groupId', {
        groupId: filter.groupId,
      });
    }

    if (filter.questionId) {
      queryBuilder.andWhere('mapping.questionId = :questionId', {
        questionId: filter.questionId,
      });
    }

    queryBuilder.orderBy('mapping.displayOrder', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * 질문 그룹 매핑을 생성한다
   */
  async 생성한다(
    createDto: CreateQuestionGroupMappingDto,
    createdBy: string,
  ): Promise<QuestionGroupMapping> {
    this.logger.log(
      `질문 그룹 매핑 생성 시작 - 그룹 ID: ${createDto.groupId}, 질문 ID: ${createDto.questionId}`,
    );

    // 중복 검사
    const exists = await this.매핑중복확인한다(
      createDto.groupId,
      createDto.questionId,
    );
    if (exists) {
      throw new DuplicateQuestionGroupMappingException(
        createDto.groupId,
        createDto.questionId,
      );
    }

    try {
      const mapping = new QuestionGroupMapping({ ...createDto, createdBy });
      const saved = await this.mappingRepository.save(mapping);

      this.logger.log(`질문 그룹 매핑 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `질문 그룹 매핑 생성 실패 - 그룹 ID: ${createDto.groupId}, 질문 ID: ${createDto.questionId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 질문 그룹 매핑을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateDto: UpdateQuestionGroupMappingDto,
    updatedBy: string,
  ): Promise<QuestionGroupMapping> {
    this.logger.log(`질문 그룹 매핑 수정 시작 - ID: ${id}`);

    const mapping = await this.ID로조회한다(id);
    if (!mapping) {
      throw new QuestionGroupMappingNotFoundException(id);
    }

    try {
      if (updateDto.displayOrder !== undefined) {
        mapping.표시순서변경한다(updateDto.displayOrder, updatedBy);
      }

      const saved = await this.mappingRepository.save(mapping);
      this.logger.log(`질문 그룹 매핑 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`질문 그룹 매핑 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 질문 그룹 매핑을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`질문 그룹 매핑 삭제 시작 - ID: ${id}`);

    const mapping = await this.ID로조회한다(id);
    if (!mapping) {
      throw new QuestionGroupMappingNotFoundException(id);
    }

    try {
      mapping.deletedAt = new Date();
      mapping.메타데이터를_업데이트한다(deletedBy);
      await this.mappingRepository.save(mapping);

      this.logger.log(`질문 그룹 매핑 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`질문 그룹 매핑 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 그룹의 모든 매핑을 삭제한다
   */
  async 그룹매핑전체삭제한다(
    groupId: string,
    deletedBy: string,
  ): Promise<void> {
    this.logger.log(`그룹의 모든 매핑 삭제 시작 - 그룹 ID: ${groupId}`);

    const mappings = await this.그룹ID로조회한다(groupId);

    try {
      for (const mapping of mappings) {
        mapping.deletedAt = new Date();
        mapping.메타데이터를_업데이트한다(deletedBy);
      }

      await this.mappingRepository.save(mappings);
      this.logger.log(
        `그룹의 모든 매핑 삭제 완료 - 그룹 ID: ${groupId}, 삭제 개수: ${mappings.length}`,
      );
    } catch (error) {
      this.logger.error(
        `그룹의 모든 매핑 삭제 실패 - 그룹 ID: ${groupId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 질문의 모든 매핑을 삭제한다
   */
  async 질문매핑전체삭제한다(
    questionId: string,
    deletedBy: string,
  ): Promise<void> {
    this.logger.log(`질문의 모든 매핑 삭제 시작 - 질문 ID: ${questionId}`);

    const mappings = await this.질문ID로조회한다(questionId);

    try {
      for (const mapping of mappings) {
        mapping.deletedAt = new Date();
        mapping.메타데이터를_업데이트한다(deletedBy);
      }

      await this.mappingRepository.save(mappings);
      this.logger.log(
        `질문의 모든 매핑 삭제 완료 - 질문 ID: ${questionId}, 삭제 개수: ${mappings.length}`,
      );
    } catch (error) {
      this.logger.error(
        `질문의 모든 매핑 삭제 실패 - 질문 ID: ${questionId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 매핑 중복을 확인한다
   */
  async 매핑중복확인한다(
    groupId: string,
    questionId: string,
  ): Promise<boolean> {
    const count = await this.mappingRepository.count({
      where: { groupId, questionId, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 그룹 내 질문 개수를 조회한다
   */
  async 그룹내질문개수조회한다(groupId: string): Promise<number> {
    return await this.mappingRepository.count({
      where: { groupId, deletedAt: IsNull() },
    });
  }

  /**
   * 질문이 속한 그룹 개수를 조회한다
   */
  async 질문의그룹개수조회한다(questionId: string): Promise<number> {
    return await this.mappingRepository.count({
      where: { questionId, deletedAt: IsNull() },
    });
  }
}
