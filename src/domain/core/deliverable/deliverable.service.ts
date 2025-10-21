import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deliverable } from './deliverable.entity';
import {
  DeliverableNotFoundException,
  DeliverableValidationException,
  DeliverableDuplicateException,
} from './deliverable.exceptions';
import type {
  CreateDeliverableData,
  UpdateDeliverableData,
  DeliverableFilter,
} from './deliverable.types';

/**
 * 산출물 서비스
 * 산출물 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class DeliverableService {
  private readonly logger = new Logger(DeliverableService.name);

  constructor(
    @InjectRepository(Deliverable)
    private readonly deliverableRepository: Repository<Deliverable>,
  ) {}

  /**
   * 산출물을 생성한다
   */
  async 생성한다(createData: CreateDeliverableData): Promise<Deliverable> {
    this.logger.log(`산출물 생성 시작 - 이름: ${createData.name}`);

    // 중복 검사
    await this.중복_검사를_수행한다(createData.name);

    // 유효성 검사
    this.유효성을_검사한다(createData);

    try {
      const deliverable = new Deliverable(createData);
      const saved = await this.deliverableRepository.save(deliverable);

      this.logger.log(`산출물 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `산출물 생성 실패 - 이름: ${createData.name}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 산출물을 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateDeliverableData,
    updatedBy: string,
  ): Promise<Deliverable> {
    this.logger.log(`산출물 수정 시작 - ID: ${id}`);

    const deliverable = await this.조회한다(id);
    if (!deliverable) {
      throw new DeliverableNotFoundException(id);
    }

    // 유효성 검사
    if (updateData.name !== undefined) {
      this.이름_유효성을_검사한다(updateData.name);
    }

    try {
      deliverable.산출물을_수정한다(
        updateData.name,
        updateData.description,
        updateData.type,
        updateData.filePath,
        updateData.employeeId,
        updateData.wbsItemId,
        updatedBy,
      );

      // 활성 상태 변경 처리
      if (updateData.isActive !== undefined) {
        if (updateData.isActive) {
          deliverable.활성화한다(updatedBy);
        } else {
          deliverable.비활성화한다(updatedBy);
        }
      }

      const saved = await this.deliverableRepository.save(deliverable);

      this.logger.log(`산출물 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`산출물 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 산출물을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`산출물 삭제 시작 - ID: ${id}`);

    const deliverable = await this.조회한다(id);
    if (!deliverable) {
      throw new DeliverableNotFoundException(id);
    }

    try {
      deliverable.메타데이터를_업데이트한다(deletedBy);
      deliverable.삭제한다();

      await this.deliverableRepository.save(deliverable);

      this.logger.log(`산출물 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`산출물 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 산출물을 조회한다
   */
  async 조회한다(id: string): Promise<Deliverable | null> {
    this.logger.debug(`산출물 조회 - ID: ${id}`);

    try {
      return await this.deliverableRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`산출물 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 산출물 목록을 조회한다
   */
  async 필터_조회한다(filter: DeliverableFilter): Promise<Deliverable[]> {
    this.logger.debug(`산출물 필터 조회 - 필터: ${JSON.stringify(filter)}`);

    try {
      let queryBuilder =
        this.deliverableRepository.createQueryBuilder('deliverable');

      // 필터 적용
      if (filter.type) {
        queryBuilder.andWhere('deliverable.type = :type', {
          type: filter.type,
        });
      }

      if (filter.employeeId) {
        queryBuilder.andWhere('deliverable.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.wbsItemId) {
        queryBuilder.andWhere('deliverable.wbsItemId = :wbsItemId', {
          wbsItemId: filter.wbsItemId,
        });
      }

      if (filter.mappedBy) {
        queryBuilder.andWhere('deliverable.mappedBy = :mappedBy', {
          mappedBy: filter.mappedBy,
        });
      }

      if (filter.activeOnly) {
        queryBuilder.andWhere('deliverable.isActive = :isActive', {
          isActive: true,
        });
      }

      if (filter.inactiveOnly) {
        queryBuilder.andWhere('deliverable.isActive = :isActive', {
          isActive: false,
        });
      }

      if (filter.mappedDateFrom) {
        queryBuilder.andWhere('deliverable.mappedDate >= :mappedDateFrom', {
          mappedDateFrom: filter.mappedDateFrom,
        });
      }

      if (filter.mappedDateTo) {
        queryBuilder.andWhere('deliverable.mappedDate <= :mappedDateTo', {
          mappedDateTo: filter.mappedDateTo,
        });
      }

      // 정렬
      const orderBy = filter.orderBy || 'createdAt';
      const orderDirection = filter.orderDirection || 'DESC';
      queryBuilder.orderBy(`deliverable.${orderBy}`, orderDirection);

      // 페이지네이션
      if (filter.page && filter.limit) {
        const offset = (filter.page - 1) * filter.limit;
        queryBuilder.skip(offset).take(filter.limit);
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(
        `산출물 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 중복 검사를 수행한다
   */
  private async 중복_검사를_수행한다(name: string): Promise<void> {
    const existing = await this.deliverableRepository.findOne({
      where: {
        name,
      },
    });

    if (existing) {
      throw new DeliverableDuplicateException(name);
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateDeliverableData): void {
    if (!data.name?.trim()) {
      throw new DeliverableValidationException('산출물명은 필수입니다.');
    }

    if (!data.type) {
      throw new DeliverableValidationException('산출물 유형은 필수입니다.');
    }

    this.이름_유효성을_검사한다(data.name);
  }

  /**
   * 이름 유효성을 검사한다
   */
  private 이름_유효성을_검사한다(name: string): void {
    if (name.length < 2) {
      throw new DeliverableValidationException(
        '산출물명은 최소 2자 이상이어야 합니다.',
      );
    }

    if (name.length > 255) {
      throw new DeliverableValidationException(
        '산출물명은 최대 255자까지 가능합니다.',
      );
    }
  }

  /**
   * 직원별 산출물 목록을 조회한다
   */
  async 직원별_조회한다(employeeId: string): Promise<Deliverable[]> {
    this.logger.debug(`직원별 산출물 조회 - 직원: ${employeeId}`);

    try {
      return await this.필터_조회한다({ employeeId, activeOnly: true });
    } catch (error) {
      this.logger.error(
        `직원별 산출물 조회 실패 - 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * WBS 항목별 산출물 목록을 조회한다
   */
  async WBS항목별_조회한다(wbsItemId: string): Promise<Deliverable[]> {
    this.logger.debug(`WBS 항목별 산출물 조회 - WBS: ${wbsItemId}`);

    try {
      return await this.필터_조회한다({ wbsItemId, activeOnly: true });
    } catch (error) {
      this.logger.error(
        `WBS 항목별 산출물 조회 실패 - WBS: ${wbsItemId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 산출물에 직원과 WBS 항목을 매핑한다
   */
  async 매핑한다(
    id: string,
    employeeId: string,
    wbsItemId: string,
    mappedBy: string,
  ): Promise<Deliverable> {
    this.logger.log(
      `산출물 매핑 시작 - ID: ${id}, 직원: ${employeeId}, WBS: ${wbsItemId}`,
    );

    const deliverable = await this.조회한다(id);
    if (!deliverable) {
      throw new DeliverableNotFoundException(id);
    }

    try {
      deliverable.매핑한다(employeeId, wbsItemId, mappedBy);

      const saved = await this.deliverableRepository.save(deliverable);

      this.logger.log(`산출물 매핑 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`산출물 매핑 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 산출물의 매핑을 해제한다
   */
  async 매핑을_해제한다(id: string, unmappedBy: string): Promise<Deliverable> {
    this.logger.log(`산출물 매핑 해제 시작 - ID: ${id}`);

    const deliverable = await this.조회한다(id);
    if (!deliverable) {
      throw new DeliverableNotFoundException(id);
    }

    try {
      deliverable.매핑을_해제한다(unmappedBy);

      const saved = await this.deliverableRepository.save(deliverable);

      this.logger.log(`산출물 매핑 해제 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`산출물 매핑 해제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 산출물을 활성화한다
   */
  async 활성화한다(id: string, activatedBy: string): Promise<Deliverable> {
    this.logger.log(`산출물 활성화 시작 - ID: ${id}`);

    const deliverable = await this.조회한다(id);
    if (!deliverable) {
      throw new DeliverableNotFoundException(id);
    }

    try {
      deliverable.활성화한다(activatedBy);

      const saved = await this.deliverableRepository.save(deliverable);

      this.logger.log(`산출물 활성화 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`산출물 활성화 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 산출물을 비활성화한다
   */
  async 비활성화한다(id: string, deactivatedBy: string): Promise<Deliverable> {
    this.logger.log(`산출물 비활성화 시작 - ID: ${id}`);

    const deliverable = await this.조회한다(id);
    if (!deliverable) {
      throw new DeliverableNotFoundException(id);
    }

    try {
      deliverable.비활성화한다(deactivatedBy);

      const saved = await this.deliverableRepository.save(deliverable);

      this.logger.log(`산출물 비활성화 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`산출물 비활성화 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
