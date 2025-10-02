import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationMapping } from './wbs-self-evaluation-mapping.entity';
import {
  WbsSelfEvaluationMappingDuplicateException,
  WbsSelfEvaluationMappingNotFoundException,
  WbsSelfEvaluationMappingValidationException,
} from './wbs-self-evaluation-mapping.exceptions';
import type {
  CreateWbsSelfEvaluationMappingData,
  UpdateWbsSelfEvaluationMappingData,
  WbsSelfEvaluationMappingFilter,
} from './wbs-self-evaluation-mapping.types';

/**
 * WBS 자가평가 매핑 서비스
 * WBS 자가평가 매핑 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class WbsSelfEvaluationMappingService {
  private readonly logger = new Logger(WbsSelfEvaluationMappingService.name);

  constructor(
    @InjectRepository(WbsSelfEvaluationMapping)
    private readonly wbsSelfEvaluationMappingRepository: Repository<WbsSelfEvaluationMapping>,
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
   * WBS 자가평가 매핑을 생성한다
   */
  async 생성한다(
    createData: CreateWbsSelfEvaluationMappingData,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluationMapping> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(
        `WBS 자가평가 매핑 생성 시작 - 직원: ${createData.employeeId}, WBS: ${createData.wbsItemId}`,
      );

      // 중복 검사
      await this.중복_검사를_수행한다(
        createData.periodId,
        createData.employeeId,
        createData.wbsItemId,
        manager,
      );

      // 유효성 검사
      this.유효성을_검사한다(createData);

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluationMapping,
        this.wbsSelfEvaluationMappingRepository,
        manager,
      );

      const wbsSelfEvaluationMapping = new WbsSelfEvaluationMapping(createData);
      const saved = await repository.save(wbsSelfEvaluationMapping);

      this.logger.log(`WBS 자가평가 매핑 생성 완료 - ID: ${saved.id}`);
      return saved;
    }, '생성한다');
  }

  /**
   * WBS 자가평가 매핑을 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateWbsSelfEvaluationMappingData,
    updatedBy: string,
  ): Promise<WbsSelfEvaluationMapping> {
    this.logger.log(`WBS 자가평가 매핑 수정 시작 - ID: ${id}`);

    const wbsSelfEvaluationMapping = await this.조회한다(id);
    if (!wbsSelfEvaluationMapping) {
      throw new WbsSelfEvaluationMappingNotFoundException(id);
    }

    try {
      if (updateData.assignedBy) {
        wbsSelfEvaluationMapping.assignedBy = updateData.assignedBy;
      }

      if (updateData.isCompleted !== undefined) {
        if (updateData.isCompleted) {
          wbsSelfEvaluationMapping.자가평가를_완료한다();
        } else {
          wbsSelfEvaluationMapping.자가평가_완료를_취소한다();
        }
      }

      wbsSelfEvaluationMapping.메타데이터를_업데이트한다(updatedBy);

      const saved = await this.wbsSelfEvaluationMappingRepository.save(
        wbsSelfEvaluationMapping,
      );

      this.logger.log(`WBS 자가평가 매핑 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`WBS 자가평가 매핑 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * WBS 자가평가 매핑을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`WBS 자가평가 매핑 삭제 시작 - ID: ${id}`);

    const wbsSelfEvaluationMapping = await this.조회한다(id);
    if (!wbsSelfEvaluationMapping) {
      throw new WbsSelfEvaluationMappingNotFoundException(id);
    }

    try {
      wbsSelfEvaluationMapping.메타데이터를_업데이트한다(deletedBy);
      wbsSelfEvaluationMapping.삭제한다();

      await this.wbsSelfEvaluationMappingRepository.save(
        wbsSelfEvaluationMapping,
      );

      this.logger.log(`WBS 자가평가 매핑 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`WBS 자가평가 매핑 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * WBS 자가평가 매핑을 조회한다
   */
  async 조회한다(id: string): Promise<WbsSelfEvaluationMapping | null> {
    this.logger.debug(`WBS 자가평가 매핑 조회 - ID: ${id}`);

    try {
      return await this.wbsSelfEvaluationMappingRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`WBS 자가평가 매핑 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 WBS 자가평가 매핑 목록을 조회한다
   */
  async 필터_조회한다(
    filter: WbsSelfEvaluationMappingFilter,
  ): Promise<WbsSelfEvaluationMapping[]> {
    this.logger.debug(
      `WBS 자가평가 매핑 필터 조회 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      let queryBuilder =
        this.wbsSelfEvaluationMappingRepository.createQueryBuilder('mapping');

      // 필터 적용
      if (filter.periodId) {
        queryBuilder.andWhere('mapping.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.employeeId) {
        queryBuilder.andWhere('mapping.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.wbsItemId) {
        queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', {
          wbsItemId: filter.wbsItemId,
        });
      }

      if (filter.assignedBy) {
        queryBuilder.andWhere('mapping.assignedBy = :assignedBy', {
          assignedBy: filter.assignedBy,
        });
      }

      if (filter.completedOnly) {
        queryBuilder.andWhere('mapping.isCompleted = :isCompleted', {
          isCompleted: true,
        });
      }

      if (filter.uncompletedOnly) {
        queryBuilder.andWhere('mapping.isCompleted = :isCompleted', {
          isCompleted: false,
        });
      }

      if (filter.assignedDateFrom) {
        queryBuilder.andWhere('mapping.assignedDate >= :assignedDateFrom', {
          assignedDateFrom: filter.assignedDateFrom,
        });
      }

      if (filter.assignedDateTo) {
        queryBuilder.andWhere('mapping.assignedDate <= :assignedDateTo', {
          assignedDateTo: filter.assignedDateTo,
        });
      }

      if (filter.completedDateFrom) {
        queryBuilder.andWhere('mapping.completedAt >= :completedDateFrom', {
          completedDateFrom: filter.completedDateFrom,
        });
      }

      if (filter.completedDateTo) {
        queryBuilder.andWhere('mapping.completedAt <= :completedDateTo', {
          completedDateTo: filter.completedDateTo,
        });
      }

      // 정렬
      const orderBy = filter.orderBy || 'assignedDate';
      const orderDirection = filter.orderDirection || 'DESC';
      queryBuilder.orderBy(`mapping.${orderBy}`, orderDirection);

      // 페이지네이션
      if (filter.page && filter.limit) {
        const offset = (filter.page - 1) * filter.limit;
        queryBuilder.skip(offset).take(filter.limit);
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(
        `WBS 자가평가 매핑 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 직원의 WBS 자가평가 매핑을 조회한다
   */
  async 직원별_조회한다(
    employeeId: string,
    periodId?: string,
  ): Promise<WbsSelfEvaluationMapping[]> {
    this.logger.debug(
      `직원별 WBS 자가평가 매핑 조회 - 직원: ${employeeId}, 기간: ${periodId}`,
    );

    try {
      const filter: WbsSelfEvaluationMappingFilter = { employeeId };
      if (periodId) {
        filter.periodId = periodId;
      }

      return await this.필터_조회한다(filter);
    } catch (error) {
      this.logger.error(
        `직원별 WBS 자가평가 매핑 조회 실패 - 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 WBS 항목의 자가평가 매핑을 조회한다
   */
  async WBS항목별_조회한다(
    wbsItemId: string,
    periodId?: string,
  ): Promise<WbsSelfEvaluationMapping[]> {
    this.logger.debug(
      `WBS 항목별 자가평가 매핑 조회 - WBS: ${wbsItemId}, 기간: ${periodId}`,
    );

    try {
      const filter: WbsSelfEvaluationMappingFilter = { wbsItemId };
      if (periodId) {
        filter.periodId = periodId;
      }

      return await this.필터_조회한다(filter);
    } catch (error) {
      this.logger.error(
        `WBS 항목별 자가평가 매핑 조회 실패 - WBS: ${wbsItemId}`,
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
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      WbsSelfEvaluationMapping,
      this.wbsSelfEvaluationMappingRepository,
      manager,
    );

    const existing = await repository.findOne({
      where: {
        periodId,
        employeeId,
        wbsItemId,
      },
    });

    if (existing) {
      throw new WbsSelfEvaluationMappingDuplicateException(
        periodId,
        employeeId,
        wbsItemId,
      );
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateWbsSelfEvaluationMappingData): void {
    if (!data.periodId) {
      throw new WbsSelfEvaluationMappingValidationException(
        '평가 기간 ID는 필수입니다.',
      );
    }

    if (!data.employeeId) {
      throw new WbsSelfEvaluationMappingValidationException(
        '직원 ID는 필수입니다.',
      );
    }

    if (!data.wbsItemId) {
      throw new WbsSelfEvaluationMappingValidationException(
        'WBS 항목 ID는 필수입니다.',
      );
    }

    if (!data.assignedBy) {
      throw new WbsSelfEvaluationMappingValidationException(
        '할당자 ID는 필수입니다.',
      );
    }
  }

  /**
   * 자가평가 ID를 설정한다
   */
  async 자가평가_ID를_설정한다(
    mappingId: string,
    selfEvaluationId: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluationMapping> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(
        `자가평가 ID 설정 시작 - 매핑 ID: ${mappingId}, 자가평가 ID: ${selfEvaluationId}`,
      );

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluationMapping,
        this.wbsSelfEvaluationMappingRepository,
        manager,
      );

      const mapping = await repository.findOne({ where: { id: mappingId } });
      if (!mapping) {
        throw new WbsSelfEvaluationMappingNotFoundException(mappingId);
      }

      mapping.자가평가_ID를_설정한다(selfEvaluationId);
      mapping.메타데이터를_업데이트한다(updatedBy);

      const saved = await repository.save(mapping);

      this.logger.log(`자가평가 ID 설정 완료 - 매핑 ID: ${mappingId}`);
      return saved;
    }, '자가평가_ID를_설정한다');
  }

  /**
   * 자가평가를 완료로 표시한다
   */
  async 자가평가를_완료한다(
    mappingId: string,
    selfEvaluationId: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluationMapping> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(`자가평가 완료 처리 시작 - 매핑 ID: ${mappingId}`);

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluationMapping,
        this.wbsSelfEvaluationMappingRepository,
        manager,
      );

      const mapping = await repository.findOne({ where: { id: mappingId } });
      if (!mapping) {
        throw new WbsSelfEvaluationMappingNotFoundException(mappingId);
      }

      mapping.자가평가_ID를_설정한다(selfEvaluationId);
      mapping.자가평가를_완료한다();
      mapping.메타데이터를_업데이트한다(updatedBy);

      const saved = await repository.save(mapping);

      this.logger.log(`자가평가 완료 처리 완료 - 매핑 ID: ${mappingId}`);
      return saved;
    }, '자가평가를_완료한다');
  }

  /**
   * 자가평가 ID로 매핑을 조회한다
   */
  async 자가평가_ID로_조회한다(
    selfEvaluationId: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluationMapping | null> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.debug(
        `자가평가 ID로 매핑 조회 - 자가평가 ID: ${selfEvaluationId}`,
      );

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluationMapping,
        this.wbsSelfEvaluationMappingRepository,
        manager,
      );

      return await repository.findOne({
        where: { selfEvaluationId },
      });
    }, '자가평가_ID로_조회한다');
  }
}
