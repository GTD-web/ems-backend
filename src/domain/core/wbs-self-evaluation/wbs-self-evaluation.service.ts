import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsSelfEvaluation } from './wbs-self-evaluation.entity';
import {
  WbsSelfEvaluationDuplicateException,
  WbsSelfEvaluationNotFoundException,
  WbsSelfEvaluationValidationException,
} from './wbs-self-evaluation.exceptions';
import type {
  CreateWbsSelfEvaluationData,
  UpdateWbsSelfEvaluationData,
  WbsSelfEvaluationFilter,
} from './wbs-self-evaluation.types';

/**
 * WBS 자가평가 서비스
 * WBS 자가평가 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class WbsSelfEvaluationService {
  private readonly logger = new Logger(WbsSelfEvaluationService.name);

  constructor(
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
  ) {}

  /**
   * WBS 자가평가를 생성한다
   */
  async 생성한다(
    createData: CreateWbsSelfEvaluationData,
  ): Promise<WbsSelfEvaluation> {
    this.logger.log(
      `WBS 자가평가 생성 시작 - 직원: ${createData.employeeId}, WBS: ${createData.wbsItemId}`,
    );

    // 중복 검사
    await this.중복_검사를_수행한다(
      createData.periodId,
      createData.employeeId,
      createData.wbsItemId,
    );

    // 유효성 검사
    this.유효성을_검사한다(createData);

    try {
      const wbsSelfEvaluation = new WbsSelfEvaluation(createData);
      const saved =
        await this.wbsSelfEvaluationRepository.save(wbsSelfEvaluation);

      this.logger.log(`WBS 자가평가 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `WBS 자가평가 생성 실패 - 직원: ${createData.employeeId}, WBS: ${createData.wbsItemId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * WBS 자가평가를 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateWbsSelfEvaluationData,
    updatedBy: string,
  ): Promise<WbsSelfEvaluation> {
    this.logger.log(`WBS 자가평가 수정 시작 - ID: ${id}`);

    const wbsSelfEvaluation = await this.조회한다(id);
    if (!wbsSelfEvaluation) {
      throw new WbsSelfEvaluationNotFoundException(id);
    }

    // 유효성 검사
    if (updateData.selfEvaluationScore !== undefined) {
      this.점수_유효성을_검사한다(updateData.selfEvaluationScore);
    }

    try {
      wbsSelfEvaluation.자가평가를_수정한다(
        updateData.selfEvaluationContent ||
          wbsSelfEvaluation.selfEvaluationContent,
        updateData.selfEvaluationScore || wbsSelfEvaluation.selfEvaluationScore,
        updateData.additionalComments,
        updatedBy,
      );

      const saved =
        await this.wbsSelfEvaluationRepository.save(wbsSelfEvaluation);

      this.logger.log(`WBS 자가평가 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`WBS 자가평가 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * WBS 자가평가를 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`WBS 자가평가 삭제 시작 - ID: ${id}`);

    const wbsSelfEvaluation = await this.조회한다(id);
    if (!wbsSelfEvaluation) {
      throw new WbsSelfEvaluationNotFoundException(id);
    }

    try {
      wbsSelfEvaluation.메타데이터를_업데이트한다(deletedBy);
      wbsSelfEvaluation.삭제한다();

      await this.wbsSelfEvaluationRepository.save(wbsSelfEvaluation);

      this.logger.log(`WBS 자가평가 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`WBS 자가평가 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * WBS 자가평가를 조회한다
   */
  async 조회한다(id: string): Promise<WbsSelfEvaluation | null> {
    this.logger.debug(`WBS 자가평가 조회 - ID: ${id}`);

    try {
      return await this.wbsSelfEvaluationRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`WBS 자가평가 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 WBS 자가평가 목록을 조회한다
   */
  async 필터_조회한다(
    filter: WbsSelfEvaluationFilter,
  ): Promise<WbsSelfEvaluation[]> {
    this.logger.debug(
      `WBS 자가평가 필터 조회 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      let queryBuilder =
        this.wbsSelfEvaluationRepository.createQueryBuilder('evaluation');

      // 필터 적용
      if (filter.periodId) {
        queryBuilder.andWhere('evaluation.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.employeeId) {
        queryBuilder.andWhere('evaluation.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.wbsItemId) {
        queryBuilder.andWhere('evaluation.wbsItemId = :wbsItemId', {
          wbsItemId: filter.wbsItemId,
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

      if (filter.scoreFrom !== undefined) {
        queryBuilder.andWhere('evaluation.selfEvaluationScore >= :scoreFrom', {
          scoreFrom: filter.scoreFrom,
        });
      }

      if (filter.scoreTo !== undefined) {
        queryBuilder.andWhere('evaluation.selfEvaluationScore <= :scoreTo', {
          scoreTo: filter.scoreTo,
        });
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
        `WBS 자가평가 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 직원의 WBS 자가평가를 조회한다
   */
  async 직원별_조회한다(
    employeeId: string,
    periodId?: string,
  ): Promise<WbsSelfEvaluation[]> {
    this.logger.debug(
      `직원별 WBS 자가평가 조회 - 직원: ${employeeId}, 기간: ${periodId}`,
    );

    try {
      const filter: WbsSelfEvaluationFilter = { employeeId };
      if (periodId) {
        filter.periodId = periodId;
      }

      return await this.필터_조회한다(filter);
    } catch (error) {
      this.logger.error(
        `직원별 WBS 자가평가 조회 실패 - 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 WBS 항목의 자가평가를 조회한다
   */
  async WBS항목별_조회한다(
    wbsItemId: string,
    periodId?: string,
  ): Promise<WbsSelfEvaluation[]> {
    this.logger.debug(
      `WBS 항목별 자가평가 조회 - WBS: ${wbsItemId}, 기간: ${periodId}`,
    );

    try {
      const filter: WbsSelfEvaluationFilter = { wbsItemId };
      if (periodId) {
        filter.periodId = periodId;
      }

      return await this.필터_조회한다(filter);
    } catch (error) {
      this.logger.error(
        `WBS 항목별 자가평가 조회 실패 - WBS: ${wbsItemId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 중복 검사를 수행한다
   */
  private async 중복_검사를_수행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
  ): Promise<void> {
    const existing = await this.wbsSelfEvaluationRepository.findOne({
      where: {
        periodId,
        employeeId,
        wbsItemId,
      },
    });

    if (existing) {
      throw new WbsSelfEvaluationDuplicateException(
        periodId,
        employeeId,
        wbsItemId,
      );
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateWbsSelfEvaluationData): void {
    if (!data.periodId) {
      throw new WbsSelfEvaluationValidationException(
        '평가 기간 ID는 필수입니다.',
      );
    }

    if (!data.employeeId) {
      throw new WbsSelfEvaluationValidationException('직원 ID는 필수입니다.');
    }

    if (!data.wbsItemId) {
      throw new WbsSelfEvaluationValidationException(
        'WBS 항목 ID는 필수입니다.',
      );
    }

    if (!data.selfEvaluationContent?.trim()) {
      throw new WbsSelfEvaluationValidationException(
        '자가평가 내용은 필수입니다.',
      );
    }

    this.점수_유효성을_검사한다(data.selfEvaluationScore);
  }

  /**
   * 점수 유효성을 검사한다
   */
  private 점수_유효성을_검사한다(score: number): void {
    if (score < 1 || score > 5) {
      throw new WbsSelfEvaluationValidationException(
        '자가평가 점수는 1-5 사이여야 합니다.',
      );
    }
  }
}
