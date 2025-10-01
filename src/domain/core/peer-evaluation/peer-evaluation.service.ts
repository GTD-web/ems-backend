import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeerEvaluation } from './peer-evaluation.entity';
import {
  PeerEvaluationNotFoundException,
  PeerEvaluationValidationException,
  PeerEvaluationDuplicateException,
} from './peer-evaluation.exceptions';
import type {
  CreatePeerEvaluationData,
  UpdatePeerEvaluationData,
  PeerEvaluationFilter,
} from './peer-evaluation.types';

/**
 * 동료평가 서비스
 * 동료평가 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class PeerEvaluationService {
  private readonly logger = new Logger(PeerEvaluationService.name);

  constructor(
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
  ) {}

  /**
   * 동료평가를 생성한다
   */
  async 생성한다(
    createData: CreatePeerEvaluationData,
  ): Promise<PeerEvaluation> {
    this.logger.log(
      `동료평가 생성 시작 - 상태: ${createData.status || 'pending'}`,
    );

    // 유효성 검사
    this.유효성을_검사한다(createData);

    try {
      const peerEvaluation = new PeerEvaluation(createData);
      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `동료평가 생성 실패 - 상태: ${createData.status || 'pending'}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 동료평가를 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdatePeerEvaluationData,
    updatedBy: string,
  ): Promise<PeerEvaluation> {
    this.logger.log(`동료평가 수정 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    // 유효성 검사
    if (updateData.score !== undefined) {
      this.점수_유효성을_검사한다(updateData.score);
    }

    try {
      peerEvaluation.동료평가를_수정한다(
        updateData.evaluationContent,
        updateData.score,
        updatedBy,
      );

      // 상태 변경 처리
      if (updateData.status !== undefined) {
        if (updateData.status === 'completed') {
          peerEvaluation.평가를_완료한다(updatedBy);
        } else if (updateData.status === 'in_progress') {
          peerEvaluation.진행중으로_변경한다(updatedBy);
        } else {
          peerEvaluation.status = updateData.status;
          peerEvaluation.메타데이터를_업데이트한다(updatedBy);
        }
      }

      // 완료 상태 변경 처리
      if (updateData.isCompleted !== undefined) {
        if (updateData.isCompleted) {
          peerEvaluation.평가를_완료한다(updatedBy);
        } else {
          peerEvaluation.isCompleted = false;
          peerEvaluation.completedAt = undefined;
          peerEvaluation.메타데이터를_업데이트한다(updatedBy);
        }
      }

      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 동료평가를 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`동료평가 삭제 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    try {
      peerEvaluation.메타데이터를_업데이트한다(deletedBy);
      peerEvaluation.삭제한다();

      await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`동료평가 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 동료평가를 조회한다
   */
  async 조회한다(id: string): Promise<PeerEvaluation | null> {
    this.logger.debug(`동료평가 조회 - ID: ${id}`);

    try {
      return await this.peerEvaluationRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`동료평가 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 동료평가 목록을 조회한다
   */
  async 필터_조회한다(filter: PeerEvaluationFilter): Promise<PeerEvaluation[]> {
    this.logger.debug(`동료평가 필터 조회 - 필터: ${JSON.stringify(filter)}`);

    try {
      let queryBuilder =
        this.peerEvaluationRepository.createQueryBuilder('evaluation');

      // 필터 적용
      if (filter.status) {
        queryBuilder.andWhere('evaluation.status = :status', {
          status: filter.status,
        });
      }

      if (filter.completedOnly) {
        queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
          isCompleted: true,
        });
      }

      if (filter.uncompletedOnly) {
        queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
          isCompleted: false,
        });
      }

      if (filter.pendingOnly) {
        queryBuilder.andWhere('evaluation.status = :status', {
          status: 'pending',
        });
      }

      if (filter.inProgressOnly) {
        queryBuilder.andWhere('evaluation.status = :status', {
          status: 'in_progress',
        });
      }

      if (filter.scoreFrom !== undefined) {
        queryBuilder.andWhere('evaluation.score >= :scoreFrom', {
          scoreFrom: filter.scoreFrom,
        });
      }

      if (filter.scoreTo !== undefined) {
        queryBuilder.andWhere('evaluation.score <= :scoreTo', {
          scoreTo: filter.scoreTo,
        });
      }

      if (filter.evaluationDateFrom) {
        queryBuilder.andWhere(
          'evaluation.evaluationDate >= :evaluationDateFrom',
          {
            evaluationDateFrom: filter.evaluationDateFrom,
          },
        );
      }

      if (filter.evaluationDateTo) {
        queryBuilder.andWhere(
          'evaluation.evaluationDate <= :evaluationDateTo',
          {
            evaluationDateTo: filter.evaluationDateTo,
          },
        );
      }

      // 정렬
      const orderBy = filter.orderBy || 'evaluationDate';
      const orderDirection = filter.orderDirection || 'DESC';
      queryBuilder.orderBy(`evaluation.${orderBy}`, orderDirection);

      // 페이지네이션
      if (filter.page && filter.limit) {
        const offset = (filter.page - 1) * filter.limit;
        queryBuilder.skip(offset).take(filter.limit);
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(
        `동료평가 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 동료평가를 완료로 표시한다
   */
  async 완료한다(id: string, completedBy: string): Promise<PeerEvaluation> {
    this.logger.log(`동료평가 완료 처리 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    try {
      peerEvaluation.평가를_완료한다(completedBy);

      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 완료 처리 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 완료 처리 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 동료평가를 진행중으로 변경한다
   */
  async 진행중으로_변경한다(
    id: string,
    updatedBy: string,
  ): Promise<PeerEvaluation> {
    this.logger.log(`동료평가 진행중 변경 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    try {
      peerEvaluation.진행중으로_변경한다(updatedBy);

      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 진행중 변경 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 진행중 변경 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreatePeerEvaluationData): void {
    if (data.score !== undefined) {
      this.점수_유효성을_검사한다(data.score);
    }
  }

  /**
   * 점수 유효성을 검사한다
   */
  private 점수_유효성을_검사한다(score: number): void {
    if (score < 1 || score > 5) {
      throw new PeerEvaluationValidationException(
        '동료평가 점수는 1-5 사이여야 합니다.',
      );
    }
  }
}
