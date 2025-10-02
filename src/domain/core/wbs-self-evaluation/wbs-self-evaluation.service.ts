import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluation } from './wbs-self-evaluation.entity';
import {
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
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * 안전한 도메인 작업을 실행한다
   */
  private async executeSafeDomainOperation<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    return this.transactionManager.executeSafeOperation(operation, context);
  }

  /**
   * WBS 자가평가를 생성한다
   */
  async 생성한다(
    createData: CreateWbsSelfEvaluationData,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(`WBS 자가평가 생성 시작`);

      // 유효성 검사
      this.유효성을_검사한다(createData);

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      const wbsSelfEvaluation = new WbsSelfEvaluation(createData);
      const saved = await repository.save(wbsSelfEvaluation);

      this.logger.log(`WBS 자가평가 생성 완료 - ID: ${saved.id}`);
      return saved;
    }, '생성한다');
  }

  /**
   * WBS 자가평가를 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateWbsSelfEvaluationData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(`WBS 자가평가 수정 시작 - ID: ${id}`);

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      const wbsSelfEvaluation = await repository.findOne({ where: { id } });
      if (!wbsSelfEvaluation) {
        throw new WbsSelfEvaluationNotFoundException(id);
      }

      // 유효성 검사
      if (updateData.selfEvaluationScore !== undefined) {
        this.점수_유효성을_검사한다(updateData.selfEvaluationScore);
      }

      wbsSelfEvaluation.자가평가를_수정한다(
        updateData.selfEvaluationContent ||
          wbsSelfEvaluation.selfEvaluationContent,
        updateData.selfEvaluationScore || wbsSelfEvaluation.selfEvaluationScore,
        updateData.additionalComments,
        updatedBy,
      );

      const saved = await repository.save(wbsSelfEvaluation);

      this.logger.log(`WBS 자가평가 수정 완료 - ID: ${id}`);
      return saved;
    }, '수정한다');
  }

  /**
   * WBS 자가평가를 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(`WBS 자가평가 삭제 시작 - ID: ${id}`);

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      const wbsSelfEvaluation = await repository.findOne({ where: { id } });
      if (!wbsSelfEvaluation) {
        throw new WbsSelfEvaluationNotFoundException(id);
      }

      wbsSelfEvaluation.메타데이터를_업데이트한다(deletedBy);
      wbsSelfEvaluation.삭제한다();

      await repository.save(wbsSelfEvaluation);

      this.logger.log(`WBS 자가평가 삭제 완료 - ID: ${id}`);
    }, '삭제한다');
  }

  /**
   * WBS 자가평가를 조회한다
   */
  async 조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation | null> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.debug(`WBS 자가평가 조회 - ID: ${id}`);

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      return await repository.findOne({ where: { id } });
    }, '조회한다');
  }

  /**
   * 필터로 WBS 자가평가 목록을 조회한다
   */
  async 필터_조회한다(
    filter: WbsSelfEvaluationFilter,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation[]> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.debug(
        `WBS 자가평가 필터 조회 - 필터: ${JSON.stringify(filter)}`,
      );

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      let queryBuilder = repository.createQueryBuilder('evaluation');

      // 필터 적용
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
    }, '필터_조회한다');
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateWbsSelfEvaluationData): void {
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
