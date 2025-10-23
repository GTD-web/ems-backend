import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PeerEvaluationQuestionMapping } from './peer-evaluation-question-mapping.entity';
import {
  PeerEvaluationQuestionMappingNotFoundException,
  DuplicatePeerEvaluationQuestionMappingException,
} from './peer-evaluation-question-mapping.exceptions';
import type {
  CreatePeerEvaluationQuestionMappingDto,
  UpdatePeerEvaluationQuestionMappingDto,
  PeerEvaluationQuestionMappingFilter,
} from './peer-evaluation-question-mapping.types';
import type { IPeerEvaluationQuestionMappingService } from './interfaces/peer-evaluation-question-mapping.service.interface';

/**
 * 동료평가 질문 매핑 서비스
 * 동료평가와 평가 질문의 N:M 관계를 관리합니다.
 */
@Injectable()
export class PeerEvaluationQuestionMappingService
  implements IPeerEvaluationQuestionMappingService
{
  private readonly logger = new Logger(
    PeerEvaluationQuestionMappingService.name,
  );

  constructor(
    @InjectRepository(PeerEvaluationQuestionMapping)
    private readonly mappingRepository: Repository<PeerEvaluationQuestionMapping>,
  ) {}

  /**
   * ID로 매핑을 조회한다
   */
  async ID로조회한다(
    id: string,
  ): Promise<PeerEvaluationQuestionMapping | null> {
    this.logger.log(`동료평가 질문 매핑 조회 - ID: ${id}`);
    return await this.mappingRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * 동료평가의 질문 목록을 조회한다
   */
  async 동료평가의_질문목록을_조회한다(
    peerEvaluationId: string,
  ): Promise<PeerEvaluationQuestionMapping[]> {
    this.logger.log(
      `동료평가의 질문 목록 조회 - peerEvaluationId: ${peerEvaluationId}`,
    );
    return await this.mappingRepository.find({
      where: { peerEvaluationId, deletedAt: IsNull() },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * 질문이 사용된 동료평가 목록을 조회한다
   */
  async 질문이_사용된_동료평가목록을_조회한다(
    questionId: string,
  ): Promise<PeerEvaluationQuestionMapping[]> {
    this.logger.log(
      `질문이 사용된 동료평가 목록 조회 - questionId: ${questionId}`,
    );
    return await this.mappingRepository.find({
      where: { questionId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 필터로 조회한다
   */
  async 필터조회한다(
    filter: PeerEvaluationQuestionMappingFilter,
  ): Promise<PeerEvaluationQuestionMapping[]> {
    this.logger.log('필터로 동료평가 질문 매핑 조회', filter);

    const queryBuilder = this.mappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.deletedAt IS NULL');

    if (filter.peerEvaluationId) {
      queryBuilder.andWhere('mapping.peerEvaluationId = :peerEvaluationId', {
        peerEvaluationId: filter.peerEvaluationId,
      });
    }

    if (filter.questionId) {
      queryBuilder.andWhere('mapping.questionId = :questionId', {
        questionId: filter.questionId,
      });
    }

    if (filter.questionGroupId) {
      queryBuilder.andWhere('mapping.questionGroupId = :questionGroupId', {
        questionGroupId: filter.questionGroupId,
      });
    }

    queryBuilder.orderBy('mapping.displayOrder', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * 매핑을 생성한다
   */
  async 생성한다(
    createDto: CreatePeerEvaluationQuestionMappingDto,
    createdBy: string,
  ): Promise<PeerEvaluationQuestionMapping> {
    this.logger.log(
      `동료평가 질문 매핑 생성 - peerEvaluationId: ${createDto.peerEvaluationId}, questionId: ${createDto.questionId}`,
    );

    // 중복 검사
    const exists = await this.매핑중복확인한다(
      createDto.peerEvaluationId,
      createDto.questionId,
    );
    if (exists) {
      throw new DuplicatePeerEvaluationQuestionMappingException(
        createDto.peerEvaluationId,
        createDto.questionId,
      );
    }

    try {
      const mapping = new PeerEvaluationQuestionMapping({
        ...createDto,
        createdBy,
      });
      const saved = await this.mappingRepository.save(mapping);

      this.logger.log(`동료평가 질문 매핑 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error('동료평가 질문 매핑 생성 실패', error.stack);
      throw error;
    }
  }

  /**
   * 매핑을 수정한다
   */
  async 업데이트한다(
    id: string,
    updateDto: UpdatePeerEvaluationQuestionMappingDto,
    updatedBy: string,
  ): Promise<PeerEvaluationQuestionMapping> {
    this.logger.log(`동료평가 질문 매핑 수정 - ID: ${id}`);

    const mapping = await this.ID로조회한다(id);
    if (!mapping) {
      throw new PeerEvaluationQuestionMappingNotFoundException(id);
    }

    try {
      if (updateDto.displayOrder !== undefined) {
        mapping.표시순서변경한다(updateDto.displayOrder, updatedBy);
      }

      const saved = await this.mappingRepository.save(mapping);
      this.logger.log(`동료평가 질문 매핑 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `동료평가 질문 매핑 수정 실패 - ID: ${id}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 매핑을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`동료평가 질문 매핑 삭제 - ID: ${id}`);

    const mapping = await this.ID로조회한다(id);
    if (!mapping) {
      throw new PeerEvaluationQuestionMappingNotFoundException(id);
    }

    try {
      mapping.deletedAt = new Date();
      mapping.메타데이터를_업데이트한다(deletedBy);
      await this.mappingRepository.save(mapping);

      this.logger.log(`동료평가 질문 매핑 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(
        `동료평가 질문 매핑 삭제 실패 - ID: ${id}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 동료평가의 모든 질문 매핑을 삭제한다
   */
  async 동료평가의_질문매핑을_전체삭제한다(
    peerEvaluationId: string,
    deletedBy: string,
  ): Promise<void> {
    this.logger.log(
      `동료평가의 모든 질문 매핑 삭제 - peerEvaluationId: ${peerEvaluationId}`,
    );

    const mappings =
      await this.동료평가의_질문목록을_조회한다(peerEvaluationId);

    try {
      for (const mapping of mappings) {
        mapping.deletedAt = new Date();
        mapping.메타데이터를_업데이트한다(deletedBy);
      }

      await this.mappingRepository.save(mappings);
      this.logger.log(
        `동료평가의 모든 질문 매핑 삭제 완료 - 삭제 개수: ${mappings.length}`,
      );
    } catch (error) {
      this.logger.error(
        `동료평가의 모든 질문 매핑 삭제 실패 - peerEvaluationId: ${peerEvaluationId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 매핑 중복을 확인한다
   */
  async 매핑중복확인한다(
    peerEvaluationId: string,
    questionId: string,
  ): Promise<boolean> {
    const count = await this.mappingRepository.count({
      where: { peerEvaluationId, questionId, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 동료평가의 질문 개수를 조회한다
   */
  async 동료평가의_질문개수를_조회한다(
    peerEvaluationId: string,
  ): Promise<number> {
    return await this.mappingRepository.count({
      where: { peerEvaluationId, deletedAt: IsNull() },
    });
  }

  /**
   * 질문 그룹의 질문들을 동료평가에 일괄 추가한다
   */
  async 질문그룹의_질문들을_일괄추가한다(
    peerEvaluationId: string,
    questionGroupId: string,
    questionIds: string[],
    startDisplayOrder: number,
    createdBy: string,
  ): Promise<PeerEvaluationQuestionMapping[]> {
    this.logger.log(
      `동료평가에 질문 그룹 일괄 추가 - peerEvaluationId: ${peerEvaluationId}, questionGroupId: ${questionGroupId}, 질문 수: ${questionIds.length}`,
    );

    try {
      const mappings: PeerEvaluationQuestionMapping[] = [];

      for (let i = 0; i < questionIds.length; i++) {
        const questionId = questionIds[i];

        // 중복 검사
        const exists = await this.매핑중복확인한다(
          peerEvaluationId,
          questionId,
        );
        if (exists) {
          this.logger.warn(
            `이미 추가된 질문 건너뛰기 - questionId: ${questionId}`,
          );
          continue;
        }

        const mapping = new PeerEvaluationQuestionMapping({
          peerEvaluationId,
          questionId,
          questionGroupId,
          displayOrder: startDisplayOrder + i,
          createdBy,
        });

        mappings.push(mapping);
      }

      const saved = await this.mappingRepository.save(mappings);
      this.logger.log(
        `질문 그룹 일괄 추가 완료 - 추가된 질문 수: ${saved.length}`,
      );

      return saved;
    } catch (error) {
      this.logger.error(
        `질문 그룹 일괄 추가 실패 - peerEvaluationId: ${peerEvaluationId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 동료평가에서 특정 그룹의 질문들을 조회한다
   */
  async 동료평가의_그룹질문목록을_조회한다(
    peerEvaluationId: string,
    questionGroupId: string,
  ): Promise<PeerEvaluationQuestionMapping[]> {
    this.logger.log(
      `동료평가의 그룹 질문 목록 조회 - peerEvaluationId: ${peerEvaluationId}, questionGroupId: ${questionGroupId}`,
    );

    return await this.mappingRepository.find({
      where: { peerEvaluationId, questionGroupId, deletedAt: IsNull() },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * 동료평가와 질문으로 매핑을 조회한다
   */
  async 동료평가와_질문으로_조회한다(
    peerEvaluationId: string,
    questionId: string,
  ): Promise<PeerEvaluationQuestionMapping | null> {
    this.logger.log(
      `동료평가와 질문으로 매핑 조회 - peerEvaluationId: ${peerEvaluationId}, questionId: ${questionId}`,
    );

    return await this.mappingRepository.findOne({
      where: { peerEvaluationId, questionId, deletedAt: IsNull() },
    });
  }

  /**
   * 매핑을 저장한다
   */
  async 저장한다(
    mapping: PeerEvaluationQuestionMapping,
  ): Promise<PeerEvaluationQuestionMapping> {
    return await this.mappingRepository.save(mapping);
  }
}
