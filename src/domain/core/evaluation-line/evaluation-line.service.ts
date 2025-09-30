import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EvaluationLineValidationService } from './evaluation-line-validation.service';
import { EvaluationLine } from './evaluation-line.entity';
import { EvaluationLineNotFoundException } from './evaluation-line.exceptions';
import {
  CreateEvaluationLineDto,
  UpdateEvaluationLineDto,
  EvaluationLineFilter,
} from './evaluation-line.types';
import { IEvaluationLine } from './interfaces/evaluation-line.interface';
import { IEvaluationLineService } from './interfaces/evaluation-line.service.interface';

/**
 * 평가 라인 서비스 (MVP 버전)
 * 평가 라인의 CRUD 및 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EvaluationLineService implements IEvaluationLineService {
  private readonly logger = new Logger(EvaluationLineService.name);

  constructor(
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    private readonly transactionManager: TransactionManagerService,
    private readonly validationService: EvaluationLineValidationService,
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
   * ID로 평가 라인을 조회한다
   */
  async ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLine,
        this.evaluationLineRepository,
        manager,
      );

      const evaluationLine = await repository.findOne({
        where: { id },
      });

      this.logger.debug(`평가 라인 조회 완료 - ID: ${id}`);
      return evaluationLine;
    }, 'ID로_조회한다');
  }

  /**
   * 모든 평가 라인을 조회한다
   */
  async 전체_조회한다(manager?: EntityManager): Promise<IEvaluationLine[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLine,
        this.evaluationLineRepository,
        manager,
      );

      const evaluationLines = await repository.find({
        order: { order: 'ASC' },
      });

      this.logger.debug(
        `전체 평가 라인 조회 완료 - 개수: ${evaluationLines.length}`,
      );
      return evaluationLines;
    }, '전체_조회한다');
  }

  /**
   * 필터 조건으로 평가 라인을 조회한다
   */
  async 필터_조회한다(
    filter: EvaluationLineFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationLine[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLine,
        this.evaluationLineRepository,
        manager,
      );

      let queryBuilder = repository.createQueryBuilder('evaluationLine');

      // 필터 적용
      if (filter.evaluatorType) {
        queryBuilder.andWhere('evaluationLine.evaluatorType = :evaluatorType', {
          evaluatorType: filter.evaluatorType,
        });
      }

      if (filter.requiredOnly) {
        queryBuilder.andWhere('evaluationLine.isRequired = :isRequired', {
          isRequired: true,
        });
      }

      if (filter.autoAssignedOnly) {
        queryBuilder.andWhere(
          'evaluationLine.isAutoAssigned = :isAutoAssigned',
          {
            isAutoAssigned: true,
          },
        );
      }

      if (filter.orderFrom !== undefined) {
        queryBuilder.andWhere('evaluationLine.order >= :orderFrom', {
          orderFrom: filter.orderFrom,
        });
      }

      if (filter.orderTo !== undefined) {
        queryBuilder.andWhere('evaluationLine.order <= :orderTo', {
          orderTo: filter.orderTo,
        });
      }

      queryBuilder.orderBy('evaluationLine.order', 'ASC');

      const evaluationLines = await queryBuilder.getMany();

      this.logger.debug(
        `필터 조건 평가 라인 조회 완료 - 개수: ${evaluationLines.length}`,
      );
      return evaluationLines;
    }, '필터_조회한다');
  }

  /**
   * 평가 라인을 생성한다
   */
  async 생성한다(
    createData: CreateEvaluationLineDto,
    manager?: EntityManager,
  ): Promise<IEvaluationLine> {
    return this.executeSafeDomainOperation(async () => {
      // 유효성 검증
      await this.validationService.생성데이터검증한다(createData, manager);

      const repository = this.transactionManager.getRepository(
        EvaluationLine,
        this.evaluationLineRepository,
        manager,
      );

      const evaluationLine = repository.create({
        evaluatorType: createData.evaluatorType,
        order: createData.order,
        isRequired: createData.isRequired ?? true,
        isAutoAssigned: createData.isAutoAssigned ?? false,
      });

      const savedEvaluationLine = await repository.save(evaluationLine);

      this.logger.log(
        `평가 라인 생성 완료 - ID: ${savedEvaluationLine.id}, 유형: ${savedEvaluationLine.evaluatorType}, 순서: ${savedEvaluationLine.order}`,
      );

      return savedEvaluationLine;
    }, '생성한다');
  }

  /**
   * 평가 라인을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateData: UpdateEvaluationLineDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLine,
        this.evaluationLineRepository,
        manager,
      );

      const evaluationLine = await repository.findOne({ where: { id } });
      if (!evaluationLine) {
        throw new EvaluationLineNotFoundException(id);
      }

      // 유효성 검증
      await this.validationService.업데이트데이터검증한다(
        id,
        updateData,
        manager,
      );

      // 업데이트 적용
      if (updateData.evaluatorType !== undefined) {
        evaluationLine.평가자_유형을_변경한다(updateData.evaluatorType);
      }

      if (updateData.order !== undefined) {
        evaluationLine.평가_순서를_변경한다(updateData.order);
      }

      if (updateData.isRequired !== undefined) {
        evaluationLine.필수_평가자_여부를_변경한다(updateData.isRequired);
      }

      if (updateData.isAutoAssigned !== undefined) {
        evaluationLine.자동_할당_여부를_변경한다(updateData.isAutoAssigned);
      }

      const updatedEvaluationLine = await repository.save(evaluationLine);

      this.logger.log(
        `평가 라인 업데이트 완료 - ID: ${id}, 수정자: ${updatedBy}`,
      );

      return updatedEvaluationLine;
    }, '업데이트한다');
  }

  /**
   * 평가 라인을 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLine,
        this.evaluationLineRepository,
        manager,
      );

      const evaluationLine = await repository.findOne({ where: { id } });
      if (!evaluationLine) {
        throw new EvaluationLineNotFoundException(id);
      }

      evaluationLine.deletedAt = new Date();
      evaluationLine.수정자를_설정한다(deletedBy);
      await repository.save(evaluationLine);

      this.logger.log(`평가 라인 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
    }, '삭제한다');
  }

  /**
   * 특정 순서의 평가 라인이 존재하는지 확인한다
   */
  async 순서_중복_확인한다(
    order: number,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLine,
        this.evaluationLineRepository,
        manager,
      );

      let queryBuilder = repository
        .createQueryBuilder('evaluationLine')
        .where('evaluationLine.order = :order', { order });

      if (excludeId) {
        queryBuilder.andWhere('evaluationLine.id != :excludeId', { excludeId });
      }

      const count = await queryBuilder.getCount();
      return count > 0;
    }, '순서_중복_확인한다');
  }

  /**
   * 다음 사용 가능한 순서를 조회한다
   */
  async 다음_순서_조회한다(manager?: EntityManager): Promise<number> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLine,
        this.evaluationLineRepository,
        manager,
      );

      const result = await repository
        .createQueryBuilder('evaluationLine')
        .select('MAX(evaluationLine.order)', 'maxOrder')
        .getRawOne();

      const maxOrder = result?.maxOrder || 0;
      return maxOrder + 1;
    }, '다음_순서_조회한다');
  }
}
