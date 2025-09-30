import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WbsEvaluationCriteria } from './wbs-evaluation-criteria.entity';
import {
  WbsEvaluationCriteriaBusinessRuleViolationException,
  WbsEvaluationCriteriaDuplicateException,
  WbsEvaluationCriteriaRequiredDataMissingException,
  InvalidWbsEvaluationCriteriaDataFormatException,
} from './wbs-evaluation-criteria.exceptions';
import {
  CreateWbsEvaluationCriteriaData,
  UpdateWbsEvaluationCriteriaData,
} from './wbs-evaluation-criteria.types';

/**
 * WBS 평가 기준 유효성 검증 서비스 (MVP 버전)
 * WBS 평가 기준 관련 비즈니스 규칙과 데이터 유효성을 검증합니다.
 */
@Injectable()
export class WbsEvaluationCriteriaValidationService {
  private readonly logger = new Logger(
    WbsEvaluationCriteriaValidationService.name,
  );

  constructor(
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * WBS 평가 기준 생성 데이터를 검증한다
   */
  async 생성데이터검증한다(
    createData: CreateWbsEvaluationCriteriaData,
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.debug('WBS 평가 기준 생성 데이터 검증 시작');

    // 필수 데이터 검증
    this.필수데이터검증한다(createData);

    // 데이터 형식 검증
    this.데이터형식검증한다(createData);

    // 비즈니스 규칙 검증
    await this.비즈니스규칙검증한다(createData, manager);

    // 중복 검증
    await this.중복검증한다(createData, manager);

    this.logger.debug('WBS 평가 기준 생성 데이터 검증 완료');
  }

  /**
   * WBS 평가 기준 업데이트 데이터를 검증한다
   */
  async 업데이트데이터검증한다(
    id: string,
    updateData: UpdateWbsEvaluationCriteriaData,
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.debug(`WBS 평가 기준 업데이트 데이터 검증 시작 - ID: ${id}`);

    // 업데이트할 데이터가 있는지 확인
    if (Object.keys(updateData).length === 0) {
      throw new WbsEvaluationCriteriaRequiredDataMissingException(
        '업데이트할 데이터가 없습니다.',
      );
    }

    // 데이터 형식 검증 (업데이트 데이터만)
    this.업데이트데이터형식검증한다(updateData);

    // 기준 내용이 변경되는 경우 중복 검증
    if (updateData.criteria !== undefined) {
      await this.업데이트중복검증한다(id, updateData, manager);
    }

    this.logger.debug(`WBS 평가 기준 업데이트 데이터 검증 완료 - ID: ${id}`);
  }

  /**
   * 필수 데이터를 검증한다
   */
  private 필수데이터검증한다(
    createData: CreateWbsEvaluationCriteriaData,
  ): void {
    if (!createData.wbsItemId) {
      throw new WbsEvaluationCriteriaRequiredDataMissingException(
        'WBS 항목 ID는 필수입니다.',
      );
    }

    if (!createData.criteria) {
      throw new WbsEvaluationCriteriaRequiredDataMissingException(
        '평가 기준 내용은 필수입니다.',
      );
    }
  }

  /**
   * 데이터 형식을 검증한다
   */
  private 데이터형식검증한다(
    createData: CreateWbsEvaluationCriteriaData,
  ): void {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(createData.wbsItemId)) {
      throw new InvalidWbsEvaluationCriteriaDataFormatException(
        'WBS 항목 ID는 유효한 UUID 형식이어야 합니다.',
      );
    }

    // 평가 기준 내용 검증
    if (createData.criteria.trim().length === 0) {
      throw new InvalidWbsEvaluationCriteriaDataFormatException(
        '평가 기준 내용은 비어있을 수 없습니다.',
      );
    }

    if (createData.criteria.length > 1000) {
      throw new InvalidWbsEvaluationCriteriaDataFormatException(
        '평가 기준 내용은 1000자를 초과할 수 없습니다.',
      );
    }
  }

  /**
   * 업데이트 데이터 형식을 검증한다
   */
  private 업데이트데이터형식검증한다(
    updateData: UpdateWbsEvaluationCriteriaData,
  ): void {
    if (updateData.criteria !== undefined) {
      if (updateData.criteria.trim().length === 0) {
        throw new InvalidWbsEvaluationCriteriaDataFormatException(
          '평가 기준 내용은 비어있을 수 없습니다.',
        );
      }

      if (updateData.criteria.length > 1000) {
        throw new InvalidWbsEvaluationCriteriaDataFormatException(
          '평가 기준 내용은 1000자를 초과할 수 없습니다.',
        );
      }
    }
  }

  /**
   * 비즈니스 규칙을 검증한다
   */
  private async 비즈니스규칙검증한다(
    createData: CreateWbsEvaluationCriteriaData,
    manager?: EntityManager,
  ): Promise<void> {
    // 현재 특별한 비즈니스 규칙은 없음
    // 필요시 여기에 추가
  }

  /**
   * 중복을 검증한다
   */
  private async 중복검증한다(
    createData: CreateWbsEvaluationCriteriaData,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      WbsEvaluationCriteria,
      this.wbsEvaluationCriteriaRepository,
      manager,
    );

    const existingCriteria = await repository
      .createQueryBuilder('criteria')
      .where('criteria.wbsItemId = :wbsItemId', {
        wbsItemId: createData.wbsItemId,
      })
      .andWhere('TRIM(criteria.criteria) = :criteria', {
        criteria: createData.criteria.trim(),
      })
      .getOne();

    if (existingCriteria) {
      throw new WbsEvaluationCriteriaDuplicateException(
        createData.wbsItemId,
        createData.criteria,
      );
    }
  }

  /**
   * 업데이트 중복을 검증한다
   */
  private async 업데이트중복검증한다(
    id: string,
    updateData: UpdateWbsEvaluationCriteriaData,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      WbsEvaluationCriteria,
      this.wbsEvaluationCriteriaRepository,
      manager,
    );

    // 현재 엔티티 조회
    const currentEntity = await repository.findOne({ where: { id } });
    if (!currentEntity) {
      return; // 엔티티가 없으면 검증 생략
    }

    // 동일한 WBS 항목에서 같은 기준 내용이 있는지 확인
    const existingCriteria = await repository
      .createQueryBuilder('criteria')
      .where('criteria.wbsItemId = :wbsItemId', {
        wbsItemId: currentEntity.wbsItemId,
      })
      .andWhere('criteria.id != :id', { id })
      .andWhere('TRIM(criteria.criteria) = :criteria', {
        criteria: updateData.criteria!.trim(),
      })
      .getOne();

    if (existingCriteria) {
      throw new WbsEvaluationCriteriaDuplicateException(
        currentEntity.wbsItemId,
        updateData.criteria!,
      );
    }
  }

  /**
   * WBS 평가 기준 존재 여부를 확인한다
   */
  async 평가기준존재확인한다(
    id: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.transactionManager.getRepository(
      WbsEvaluationCriteria,
      this.wbsEvaluationCriteriaRepository,
      manager,
    );

    const count = await repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * 특정 평가 기준 존재 여부를 확인한다
   */
  async 특정평가기준존재확인한다(
    wbsItemId: string,
    criteria: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.transactionManager.getRepository(
      WbsEvaluationCriteria,
      this.wbsEvaluationCriteriaRepository,
      manager,
    );

    const count = await repository
      .createQueryBuilder('criteria')
      .where('criteria.wbsItemId = :wbsItemId', { wbsItemId })
      .andWhere('TRIM(criteria.criteria) = :criteria', {
        criteria: criteria.trim(),
      })
      .getCount();

    return count > 0;
  }
}
