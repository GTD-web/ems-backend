import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliverableMapping } from './deliverable-mapping.entity';
import {
  DeliverableMappingNotFoundException,
  DeliverableMappingValidationException,
  DeliverableMappingDuplicateException,
} from './deliverable-mapping.exceptions';
import type {
  CreateDeliverableMappingData,
  UpdateDeliverableMappingData,
  DeliverableMappingFilter,
} from './deliverable-mapping.types';

/**
 * 산출물 매핑 서비스
 * 산출물 매핑 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class DeliverableMappingService {
  private readonly logger = new Logger(DeliverableMappingService.name);

  constructor(
    @InjectRepository(DeliverableMapping)
    private readonly deliverableMappingRepository: Repository<DeliverableMapping>,
  ) {}

  /**
   * 산출물 매핑을 생성한다
   */
  async 생성한다(
    createData: CreateDeliverableMappingData,
  ): Promise<DeliverableMapping> {
    this.logger.log(
      `산출물 매핑 생성 시작 - 직원: ${createData.employeeId}, 산출물: ${createData.deliverableId}`,
    );

    // 중복 검사
    await this.중복_검사를_수행한다(
      createData.employeeId,
      createData.deliverableId,
    );

    // 유효성 검사
    this.유효성을_검사한다(createData);

    try {
      const deliverableMapping = new DeliverableMapping(createData);
      const saved =
        await this.deliverableMappingRepository.save(deliverableMapping);

      this.logger.log(`산출물 매핑 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `산출물 매핑 생성 실패 - 직원: ${createData.employeeId}, 산출물: ${createData.deliverableId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 산출물 매핑을 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateDeliverableMappingData,
    updatedBy: string,
  ): Promise<DeliverableMapping> {
    this.logger.log(`산출물 매핑 수정 시작 - ID: ${id}`);

    const deliverableMapping = await this.조회한다(id);
    if (!deliverableMapping) {
      throw new DeliverableMappingNotFoundException(id);
    }

    try {
      if (updateData.deliverableId !== undefined) {
        deliverableMapping.deliverableId = updateData.deliverableId;
      }

      if (updateData.isActive !== undefined) {
        if (updateData.isActive) {
          deliverableMapping.활성화한다(updatedBy);
        } else {
          deliverableMapping.비활성화한다(updatedBy);
        }
      }

      deliverableMapping.메타데이터를_업데이트한다(updatedBy);

      const saved =
        await this.deliverableMappingRepository.save(deliverableMapping);

      this.logger.log(`산출물 매핑 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`산출물 매핑 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 산출물 매핑을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`산출물 매핑 삭제 시작 - ID: ${id}`);

    const deliverableMapping = await this.조회한다(id);
    if (!deliverableMapping) {
      throw new DeliverableMappingNotFoundException(id);
    }

    try {
      deliverableMapping.메타데이터를_업데이트한다(deletedBy);
      deliverableMapping.삭제한다();

      await this.deliverableMappingRepository.save(deliverableMapping);

      this.logger.log(`산출물 매핑 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`산출물 매핑 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 산출물 매핑을 조회한다
   */
  async 조회한다(id: string): Promise<DeliverableMapping | null> {
    this.logger.debug(`산출물 매핑 조회 - ID: ${id}`);

    try {
      return await this.deliverableMappingRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`산출물 매핑 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 산출물 매핑 목록을 조회한다
   */
  async 필터_조회한다(
    filter: DeliverableMappingFilter,
  ): Promise<DeliverableMapping[]> {
    this.logger.debug(
      `산출물 매핑 필터 조회 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      let queryBuilder =
        this.deliverableMappingRepository.createQueryBuilder('mapping');

      // 필터 적용
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

      if (filter.deliverableId) {
        queryBuilder.andWhere('mapping.deliverableId = :deliverableId', {
          deliverableId: filter.deliverableId,
        });
      }

      if (filter.mappedBy) {
        queryBuilder.andWhere('mapping.mappedBy = :mappedBy', {
          mappedBy: filter.mappedBy,
        });
      }

      if (filter.activeOnly) {
        queryBuilder.andWhere('mapping.isActive = :isActive', {
          isActive: true,
        });
      }

      if (filter.inactiveOnly) {
        queryBuilder.andWhere('mapping.isActive = :isActive', {
          isActive: false,
        });
      }

      if (filter.mappedDateFrom) {
        queryBuilder.andWhere('mapping.mappedDate >= :mappedDateFrom', {
          mappedDateFrom: filter.mappedDateFrom,
        });
      }

      if (filter.mappedDateTo) {
        queryBuilder.andWhere('mapping.mappedDate <= :mappedDateTo', {
          mappedDateTo: filter.mappedDateTo,
        });
      }

      // 정렬
      const orderBy = filter.orderBy || 'mappedDate';
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
        `산출물 매핑 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 직원의 산출물 매핑을 조회한다
   */
  async 직원별_조회한다(employeeId: string): Promise<DeliverableMapping[]> {
    this.logger.debug(`직원별 산출물 매핑 조회 - 직원: ${employeeId}`);

    try {
      return await this.필터_조회한다({ employeeId });
    } catch (error) {
      this.logger.error(
        `직원별 산출물 매핑 조회 실패 - 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 WBS 항목의 산출물 매핑을 조회한다
   */
  async WBS항목별_조회한다(wbsItemId: string): Promise<DeliverableMapping[]> {
    this.logger.debug(`WBS 항목별 산출물 매핑 조회 - WBS: ${wbsItemId}`);

    try {
      return await this.필터_조회한다({ wbsItemId });
    } catch (error) {
      this.logger.error(
        `WBS 항목별 산출물 매핑 조회 실패 - WBS: ${wbsItemId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 산출물의 매핑을 조회한다
   */
  async 산출물별_조회한다(
    deliverableId: string,
  ): Promise<DeliverableMapping[]> {
    this.logger.debug(`산출물별 매핑 조회 - 산출물: ${deliverableId}`);

    try {
      return await this.필터_조회한다({ deliverableId });
    } catch (error) {
      this.logger.error(
        `산출물별 매핑 조회 실패 - 산출물: ${deliverableId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 중복 검사를 수행한다
   */
  private async 중복_검사를_수행한다(
    employeeId: string,
    deliverableId: string,
  ): Promise<void> {
    const existing = await this.deliverableMappingRepository.findOne({
      where: {
        employeeId,
        deliverableId,
      },
    });

    if (existing) {
      throw new DeliverableMappingDuplicateException(employeeId, deliverableId);
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateDeliverableMappingData): void {
    if (!data.employeeId) {
      throw new DeliverableMappingValidationException('직원 ID는 필수입니다.');
    }

    if (!data.wbsItemId) {
      throw new DeliverableMappingValidationException(
        'WBS 항목 ID는 필수입니다.',
      );
    }

    if (!data.deliverableId) {
      throw new DeliverableMappingValidationException(
        '산출물 ID는 필수입니다.',
      );
    }

    if (!data.mappedBy) {
      throw new DeliverableMappingValidationException(
        '매핑자 ID는 필수입니다.',
      );
    }
  }
}
