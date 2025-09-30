import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EvaluationLine } from './evaluation-line.entity';
import {
  EvaluationLineBusinessRuleViolationException,
  EvaluationLineDuplicateException,
  EvaluationLineRequiredDataMissingException,
  InvalidEvaluationLineDataFormatException,
} from './evaluation-line.exceptions';
import {
  CreateEvaluationLineDto,
  UpdateEvaluationLineDto,
  EvaluatorType,
} from './evaluation-line.types';

/**
 * 평가 라인 유효성 검증 서비스 (MVP 버전)
 * 평가 라인 관련 비즈니스 규칙과 데이터 유효성을 검증합니다.
 */
@Injectable()
export class EvaluationLineValidationService {
  private readonly logger = new Logger(EvaluationLineValidationService.name);

  constructor(
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * 평가 라인 생성 데이터를 검증한다
   */
  async 생성데이터검증한다(
    createData: CreateEvaluationLineDto,
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.debug('평가 라인 생성 데이터 검증 시작');

    // 필수 데이터 검증
    this.필수데이터검증한다(createData);

    // 데이터 형식 검증
    this.데이터형식검증한다(createData);

    // 비즈니스 규칙 검증
    await this.비즈니스규칙검증한다(createData, manager);

    // 중복 검증
    await this.중복검증한다(createData, manager);

    this.logger.debug('평가 라인 생성 데이터 검증 완료');
  }

  /**
   * 평가 라인 업데이트 데이터를 검증한다
   */
  async 업데이트데이터검증한다(
    id: string,
    updateData: UpdateEvaluationLineDto,
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.debug(`평가 라인 업데이트 데이터 검증 시작 - ID: ${id}`);

    // 업데이트할 데이터가 있는지 확인
    if (Object.keys(updateData).length === 0) {
      throw new EvaluationLineRequiredDataMissingException(
        '업데이트할 데이터가 없습니다.',
      );
    }

    // 데이터 형식 검증 (업데이트 데이터만)
    this.업데이트데이터형식검증한다(updateData);

    // 순서 중복 검증 (순서가 변경되는 경우)
    if (updateData.order !== undefined) {
      await this.순서중복검증한다(updateData.order, id, manager);
    }

    this.logger.debug(`평가 라인 업데이트 데이터 검증 완료 - ID: ${id}`);
  }

  /**
   * 필수 데이터를 검증한다
   */
  private 필수데이터검증한다(createData: CreateEvaluationLineDto): void {
    if (!createData.evaluatorType) {
      throw new EvaluationLineRequiredDataMissingException(
        '평가자 유형은 필수입니다.',
      );
    }

    if (createData.order === undefined || createData.order === null) {
      throw new EvaluationLineRequiredDataMissingException(
        '평가 순서는 필수입니다.',
      );
    }
  }

  /**
   * 데이터 형식을 검증한다
   */
  private 데이터형식검증한다(createData: CreateEvaluationLineDto): void {
    // 평가자 유형 검증
    if (!Object.values(EvaluatorType).includes(createData.evaluatorType)) {
      throw new InvalidEvaluationLineDataFormatException(
        `유효하지 않은 평가자 유형입니다: ${createData.evaluatorType}`,
      );
    }

    // 평가 순서 검증
    if (!Number.isInteger(createData.order) || createData.order < 1) {
      throw new InvalidEvaluationLineDataFormatException(
        '평가 순서는 1 이상의 정수여야 합니다.',
      );
    }

    // 불린 값 검증
    if (
      createData.isRequired !== undefined &&
      typeof createData.isRequired !== 'boolean'
    ) {
      throw new InvalidEvaluationLineDataFormatException(
        '필수 평가자 여부는 불린 값이어야 합니다.',
      );
    }

    if (
      createData.isAutoAssigned !== undefined &&
      typeof createData.isAutoAssigned !== 'boolean'
    ) {
      throw new InvalidEvaluationLineDataFormatException(
        '자동 할당 여부는 불린 값이어야 합니다.',
      );
    }
  }

  /**
   * 업데이트 데이터 형식을 검증한다
   */
  private 업데이트데이터형식검증한다(
    updateData: UpdateEvaluationLineDto,
  ): void {
    // 평가자 유형 검증
    if (
      updateData.evaluatorType !== undefined &&
      !Object.values(EvaluatorType).includes(updateData.evaluatorType)
    ) {
      throw new InvalidEvaluationLineDataFormatException(
        `유효하지 않은 평가자 유형입니다: ${updateData.evaluatorType}`,
      );
    }

    // 평가 순서 검증
    if (
      updateData.order !== undefined &&
      (!Number.isInteger(updateData.order) || updateData.order < 1)
    ) {
      throw new InvalidEvaluationLineDataFormatException(
        '평가 순서는 1 이상의 정수여야 합니다.',
      );
    }

    // 불린 값 검증
    if (
      updateData.isRequired !== undefined &&
      typeof updateData.isRequired !== 'boolean'
    ) {
      throw new InvalidEvaluationLineDataFormatException(
        '필수 평가자 여부는 불린 값이어야 합니다.',
      );
    }

    if (
      updateData.isAutoAssigned !== undefined &&
      typeof updateData.isAutoAssigned !== 'boolean'
    ) {
      throw new InvalidEvaluationLineDataFormatException(
        '자동 할당 여부는 불린 값이어야 합니다.',
      );
    }
  }

  /**
   * 비즈니스 규칙을 검증한다
   */
  private async 비즈니스규칙검증한다(
    createData: CreateEvaluationLineDto,
    manager?: EntityManager,
  ): Promise<void> {
    // 자동 할당이면서 필수가 아닌 경우 경고
    if (createData.isAutoAssigned && createData.isRequired === false) {
      this.logger.warn(
        '자동 할당 평가자가 필수가 아닌 것은 권장되지 않습니다.',
      );
    }

    // 추가적인 비즈니스 규칙이 있다면 여기에 추가
  }

  /**
   * 중복을 검증한다
   */
  private async 중복검증한다(
    createData: CreateEvaluationLineDto,
    manager?: EntityManager,
  ): Promise<void> {
    await this.순서중복검증한다(createData.order, undefined, manager);
  }

  /**
   * 순서 중복을 검증한다
   */
  private async 순서중복검증한다(
    order: number,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<void> {
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

    const existingEvaluationLine = await queryBuilder.getOne();

    if (existingEvaluationLine) {
      throw new EvaluationLineDuplicateException(
        `순서 ${order}는 이미 사용 중입니다.`,
      );
    }
  }

  /**
   * 평가 라인 존재 여부를 확인한다
   */
  async 평가라인존재확인한다(
    id: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.transactionManager.getRepository(
      EvaluationLine,
      this.evaluationLineRepository,
      manager,
    );

    const count = await repository.count({ where: { id } });
    return count > 0;
  }
}
