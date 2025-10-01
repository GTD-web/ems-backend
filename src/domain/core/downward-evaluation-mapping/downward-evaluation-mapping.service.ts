import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownwardEvaluationMapping } from './downward-evaluation-mapping.entity';
import {
  DownwardEvaluationMappingNotFoundException,
  DownwardEvaluationMappingValidationException,
  DownwardEvaluationMappingDuplicateException,
} from './downward-evaluation-mapping.exceptions';
import type {
  CreateDownwardEvaluationMappingData,
  UpdateDownwardEvaluationMappingData,
  DownwardEvaluationMappingFilter,
} from './downward-evaluation-mapping.types';

/**
 * 하향평가 매핑 서비스
 * 하향평가 매핑 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class DownwardEvaluationMappingService {
  private readonly logger = new Logger(DownwardEvaluationMappingService.name);

  constructor(
    @InjectRepository(DownwardEvaluationMapping)
    private readonly downwardEvaluationMappingRepository: Repository<DownwardEvaluationMapping>,
  ) {}

  /**
   * 하향평가 매핑을 생성한다
   */
  async 생성한다(
    createData: CreateDownwardEvaluationMappingData,
  ): Promise<DownwardEvaluationMapping> {
    this.logger.log(
      `하향평가 매핑 생성 시작 - 피평가자: ${createData.employeeId}, 평가자: ${createData.evaluatorId}`,
    );

    // 중복 검사
    await this.중복_검사를_수행한다(
      createData.employeeId,
      createData.evaluatorId,
      createData.periodId,
    );

    // 유효성 검사
    this.유효성을_검사한다(createData);

    try {
      const downwardEvaluationMapping = new DownwardEvaluationMapping(
        createData,
      );
      const saved = await this.downwardEvaluationMappingRepository.save(
        downwardEvaluationMapping,
      );

      this.logger.log(`하향평가 매핑 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `하향평가 매핑 생성 실패 - 피평가자: ${createData.employeeId}, 평가자: ${createData.evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 하향평가 매핑을 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateDownwardEvaluationMappingData,
    updatedBy: string,
  ): Promise<DownwardEvaluationMapping> {
    this.logger.log(`하향평가 매핑 수정 시작 - ID: ${id}`);

    const downwardEvaluationMapping = await this.조회한다(id);
    if (!downwardEvaluationMapping) {
      throw new DownwardEvaluationMappingNotFoundException(id);
    }

    try {
      if (updateData.downwardEvaluationId !== undefined) {
        downwardEvaluationMapping.downwardEvaluationId =
          updateData.downwardEvaluationId;
      }

      if (updateData.selfEvaluationId !== undefined) {
        if (updateData.selfEvaluationId) {
          downwardEvaluationMapping.자기평가를_연결한다(
            updateData.selfEvaluationId,
            updatedBy,
          );
        } else {
          downwardEvaluationMapping.자기평가_연결을_해제한다(updatedBy);
        }
      }

      if (updateData.isActive !== undefined) {
        if (updateData.isActive) {
          downwardEvaluationMapping.활성화한다(updatedBy);
        } else {
          downwardEvaluationMapping.비활성화한다(updatedBy);
        }
      }

      downwardEvaluationMapping.메타데이터를_업데이트한다(updatedBy);

      const saved = await this.downwardEvaluationMappingRepository.save(
        downwardEvaluationMapping,
      );

      this.logger.log(`하향평가 매핑 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`하향평가 매핑 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 하향평가 매핑을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`하향평가 매핑 삭제 시작 - ID: ${id}`);

    const downwardEvaluationMapping = await this.조회한다(id);
    if (!downwardEvaluationMapping) {
      throw new DownwardEvaluationMappingNotFoundException(id);
    }

    try {
      downwardEvaluationMapping.메타데이터를_업데이트한다(deletedBy);
      downwardEvaluationMapping.삭제한다();

      await this.downwardEvaluationMappingRepository.save(
        downwardEvaluationMapping,
      );

      this.logger.log(`하향평가 매핑 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`하향평가 매핑 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 하향평가 매핑을 조회한다
   */
  async 조회한다(id: string): Promise<DownwardEvaluationMapping | null> {
    this.logger.debug(`하향평가 매핑 조회 - ID: ${id}`);

    try {
      return await this.downwardEvaluationMappingRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`하향평가 매핑 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 하향평가 매핑 목록을 조회한다
   */
  async 필터_조회한다(
    filter: DownwardEvaluationMappingFilter,
  ): Promise<DownwardEvaluationMapping[]> {
    this.logger.debug(
      `하향평가 매핑 필터 조회 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      let queryBuilder =
        this.downwardEvaluationMappingRepository.createQueryBuilder('mapping');

      // 필터 적용
      if (filter.employeeId) {
        queryBuilder.andWhere('mapping.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.evaluatorId) {
        queryBuilder.andWhere('mapping.evaluatorId = :evaluatorId', {
          evaluatorId: filter.evaluatorId,
        });
      }

      if (filter.projectId) {
        queryBuilder.andWhere('mapping.projectId = :projectId', {
          projectId: filter.projectId,
        });
      }

      if (filter.periodId) {
        queryBuilder.andWhere('mapping.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.downwardEvaluationId) {
        queryBuilder.andWhere(
          'mapping.downwardEvaluationId = :downwardEvaluationId',
          {
            downwardEvaluationId: filter.downwardEvaluationId,
          },
        );
      }

      if (filter.selfEvaluationId) {
        queryBuilder.andWhere('mapping.selfEvaluationId = :selfEvaluationId', {
          selfEvaluationId: filter.selfEvaluationId,
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

      if (filter.withSelfEvaluation) {
        queryBuilder.andWhere('mapping.selfEvaluationId IS NOT NULL');
      }

      if (filter.withoutSelfEvaluation) {
        queryBuilder.andWhere('mapping.selfEvaluationId IS NULL');
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
        `하향평가 매핑 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 피평가자의 하향평가 매핑을 조회한다
   */
  async 피평가자별_조회한다(
    employeeId: string,
  ): Promise<DownwardEvaluationMapping[]> {
    this.logger.debug(
      `피평가자별 하향평가 매핑 조회 - 피평가자: ${employeeId}`,
    );

    try {
      return await this.필터_조회한다({ employeeId });
    } catch (error) {
      this.logger.error(
        `피평가자별 하향평가 매핑 조회 실패 - 피평가자: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가자의 하향평가 매핑을 조회한다
   */
  async 평가자별_조회한다(
    evaluatorId: string,
  ): Promise<DownwardEvaluationMapping[]> {
    this.logger.debug(`평가자별 하향평가 매핑 조회 - 평가자: ${evaluatorId}`);

    try {
      return await this.필터_조회한다({ evaluatorId });
    } catch (error) {
      this.logger.error(
        `평가자별 하향평가 매핑 조회 실패 - 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 프로젝트의 하향평가 매핑을 조회한다
   */
  async 프로젝트별_조회한다(
    projectId: string,
  ): Promise<DownwardEvaluationMapping[]> {
    this.logger.debug(`프로젝트별 하향평가 매핑 조회 - 프로젝트: ${projectId}`);

    try {
      return await this.필터_조회한다({ projectId });
    } catch (error) {
      this.logger.error(
        `프로젝트별 하향평가 매핑 조회 실패 - 프로젝트: ${projectId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가기간의 하향평가 매핑을 조회한다
   */
  async 평가기간별_조회한다(
    periodId: string,
  ): Promise<DownwardEvaluationMapping[]> {
    this.logger.debug(`평가기간별 하향평가 매핑 조회 - 기간: ${periodId}`);

    try {
      return await this.필터_조회한다({ periodId });
    } catch (error) {
      this.logger.error(
        `평가기간별 하향평가 매핑 조회 실패 - 기간: ${periodId}`,
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
    evaluatorId: string,
    periodId: string,
  ): Promise<void> {
    const existing = await this.downwardEvaluationMappingRepository.findOne({
      where: {
        employeeId,
        evaluatorId,
        periodId,
      },
    });

    if (existing) {
      throw new DownwardEvaluationMappingDuplicateException(
        employeeId,
        evaluatorId,
        periodId,
      );
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateDownwardEvaluationMappingData): void {
    if (!data.employeeId) {
      throw new DownwardEvaluationMappingValidationException(
        '피평가자 ID는 필수입니다.',
      );
    }

    if (!data.evaluatorId) {
      throw new DownwardEvaluationMappingValidationException(
        '평가자 ID는 필수입니다.',
      );
    }

    if (!data.projectId) {
      throw new DownwardEvaluationMappingValidationException(
        '프로젝트 ID는 필수입니다.',
      );
    }

    if (!data.periodId) {
      throw new DownwardEvaluationMappingValidationException(
        '평가 기간 ID는 필수입니다.',
      );
    }

    if (!data.downwardEvaluationId) {
      throw new DownwardEvaluationMappingValidationException(
        '하향평가 ID는 필수입니다.',
      );
    }

    if (!data.mappedBy) {
      throw new DownwardEvaluationMappingValidationException(
        '매핑자 ID는 필수입니다.',
      );
    }
  }
}
