import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from './downward-evaluation.entity';
import {
  DownwardEvaluationNotFoundException,
  DownwardEvaluationValidationException,
  DownwardEvaluationDuplicateException,
} from './downward-evaluation.exceptions';
import type {
  CreateDownwardEvaluationData,
  UpdateDownwardEvaluationData,
  DownwardEvaluationFilter,
} from './downward-evaluation.types';

/**
 * 하향평가 서비스
 * 하향평가 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class DownwardEvaluationService {
  private readonly logger = new Logger(DownwardEvaluationService.name);

  constructor(
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
  ) {}

  /**
   * 하향평가를 생성한다
   */
  async 생성한다(
    createData: CreateDownwardEvaluationData,
  ): Promise<DownwardEvaluation> {
    this.logger.log(`하향평가 생성 시작 - 유형: ${createData.evaluationType}`);

    // 유효성 검사
    this.유효성을_검사한다(createData);

    try {
      const downwardEvaluation = new DownwardEvaluation(createData);
      const saved =
        await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `하향평가 생성 실패 - 유형: ${createData.evaluationType}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 하향평가를 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateDownwardEvaluationData,
    updatedBy: string,
  ): Promise<DownwardEvaluation> {
    this.logger.log(`하향평가 수정 시작 - ID: ${id}`);

    const downwardEvaluation = await this.조회한다(id);
    if (!downwardEvaluation) {
      throw new DownwardEvaluationNotFoundException(id);
    }

    // 유효성 검사
    if (updateData.downwardEvaluationScore !== undefined) {
      this.점수_유효성을_검사한다(updateData.downwardEvaluationScore);
    }

    try {
      downwardEvaluation.하향평가를_수정한다(
        updateData.downwardEvaluationContent,
        updateData.downwardEvaluationScore,
        updatedBy,
      );

      // 완료 상태 변경 처리
      if (updateData.isCompleted !== undefined) {
        if (updateData.isCompleted) {
          downwardEvaluation.평가를_완료한다(updatedBy);
        } else {
          downwardEvaluation.isCompleted = false;
          downwardEvaluation.completedAt = undefined;
          downwardEvaluation.메타데이터를_업데이트한다(updatedBy);
        }
      }

      const saved =
        await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`하향평가 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 하향평가를 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`하향평가 삭제 시작 - ID: ${id}`);

    const downwardEvaluation = await this.조회한다(id);
    if (!downwardEvaluation) {
      throw new DownwardEvaluationNotFoundException(id);
    }

    try {
      downwardEvaluation.메타데이터를_업데이트한다(deletedBy);
      downwardEvaluation.삭제한다();

      await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`하향평가 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 하향평가를 조회한다
   */
  async 조회한다(id: string): Promise<DownwardEvaluation | null> {
    this.logger.debug(`하향평가 조회 - ID: ${id}`);

    try {
      return await this.downwardEvaluationRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`하향평가 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 하향평가 목록을 조회한다
   */
  async 필터_조회한다(
    filter: DownwardEvaluationFilter,
  ): Promise<DownwardEvaluation[]> {
    this.logger.debug(`하향평가 필터 조회 - 필터: ${JSON.stringify(filter)}`);

    try {
      let queryBuilder =
        this.downwardEvaluationRepository.createQueryBuilder('evaluation');

      // 필터 적용
      if (filter.evaluationType) {
        queryBuilder.andWhere('evaluation.evaluationType = :evaluationType', {
          evaluationType: filter.evaluationType,
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

      if (filter.scoreFrom !== undefined) {
        queryBuilder.andWhere(
          'evaluation.downwardEvaluationScore >= :scoreFrom',
          {
            scoreFrom: filter.scoreFrom,
          },
        );
      }

      if (filter.scoreTo !== undefined) {
        queryBuilder.andWhere(
          'evaluation.downwardEvaluationScore <= :scoreTo',
          {
            scoreTo: filter.scoreTo,
          },
        );
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
        `하향평가 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 하향평가를 완료로 표시한다
   */
  async 완료한다(id: string, completedBy: string): Promise<DownwardEvaluation> {
    this.logger.log(`하향평가 완료 처리 시작 - ID: ${id}`);

    const downwardEvaluation = await this.조회한다(id);
    if (!downwardEvaluation) {
      throw new DownwardEvaluationNotFoundException(id);
    }

    try {
      downwardEvaluation.평가를_완료한다(completedBy);

      const saved =
        await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 완료 처리 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`하향평가 완료 처리 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateDownwardEvaluationData): void {
    if (!data.evaluationType) {
      throw new DownwardEvaluationValidationException(
        '평가 유형은 필수입니다.',
      );
    }

    if (data.downwardEvaluationScore !== undefined) {
      this.점수_유효성을_검사한다(data.downwardEvaluationScore);
    }
  }

  /**
   * 점수 유효성을 검사한다
   */
  private 점수_유효성을_검사한다(score: number): void {
    if (score < 1 || score > 5) {
      throw new DownwardEvaluationValidationException(
        '하향평가 점수는 1-5 사이여야 합니다.',
      );
    }
  }
}
