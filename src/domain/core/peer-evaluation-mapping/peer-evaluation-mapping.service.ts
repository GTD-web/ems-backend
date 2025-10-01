import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeerEvaluationMapping } from './peer-evaluation-mapping.entity';
import {
  PeerEvaluationMappingNotFoundException,
  PeerEvaluationMappingValidationException,
  PeerEvaluationMappingDuplicateException,
  SelfPeerEvaluationMappingException,
} from './peer-evaluation-mapping.exceptions';
import type {
  CreatePeerEvaluationMappingData,
  UpdatePeerEvaluationMappingData,
  PeerEvaluationMappingFilter,
} from './peer-evaluation-mapping.types';

/**
 * 동료평가 매핑 서비스
 * 동료평가 매핑 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class PeerEvaluationMappingService {
  private readonly logger = new Logger(PeerEvaluationMappingService.name);

  constructor(
    @InjectRepository(PeerEvaluationMapping)
    private readonly peerEvaluationMappingRepository: Repository<PeerEvaluationMapping>,
  ) {}

  /**
   * 동료평가 매핑을 생성한다
   */
  async 생성한다(
    createData: CreatePeerEvaluationMappingData,
  ): Promise<PeerEvaluationMapping> {
    this.logger.log(
      `동료평가 매핑 생성 시작 - 피평가자: ${createData.employeeId}, 평가자: ${createData.evaluatorId}`,
    );

    // 자기 자신 평가 방지
    this.자기_자신_평가_방지_검사(
      createData.employeeId,
      createData.evaluatorId,
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
      const peerEvaluationMapping = new PeerEvaluationMapping(createData);
      const saved = await this.peerEvaluationMappingRepository.save(
        peerEvaluationMapping,
      );

      this.logger.log(`동료평가 매핑 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `동료평가 매핑 생성 실패 - 피평가자: ${createData.employeeId}, 평가자: ${createData.evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 동료평가 매핑을 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdatePeerEvaluationMappingData,
    updatedBy: string,
  ): Promise<PeerEvaluationMapping> {
    this.logger.log(`동료평가 매핑 수정 시작 - ID: ${id}`);

    const peerEvaluationMapping = await this.조회한다(id);
    if (!peerEvaluationMapping) {
      throw new PeerEvaluationMappingNotFoundException(id);
    }

    try {
      if (updateData.peerEvaluationId !== undefined) {
        peerEvaluationMapping.peerEvaluationId = updateData.peerEvaluationId;
      }

      if (updateData.isActive !== undefined) {
        if (updateData.isActive) {
          peerEvaluationMapping.활성화한다(updatedBy);
        } else {
          peerEvaluationMapping.비활성화한다(updatedBy);
        }
      }

      peerEvaluationMapping.메타데이터를_업데이트한다(updatedBy);

      const saved = await this.peerEvaluationMappingRepository.save(
        peerEvaluationMapping,
      );

      this.logger.log(`동료평가 매핑 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 매핑 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 동료평가 매핑을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`동료평가 매핑 삭제 시작 - ID: ${id}`);

    const peerEvaluationMapping = await this.조회한다(id);
    if (!peerEvaluationMapping) {
      throw new PeerEvaluationMappingNotFoundException(id);
    }

    try {
      peerEvaluationMapping.메타데이터를_업데이트한다(deletedBy);
      peerEvaluationMapping.삭제한다();

      await this.peerEvaluationMappingRepository.save(peerEvaluationMapping);

      this.logger.log(`동료평가 매핑 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`동료평가 매핑 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 동료평가 매핑을 조회한다
   */
  async 조회한다(id: string): Promise<PeerEvaluationMapping | null> {
    this.logger.debug(`동료평가 매핑 조회 - ID: ${id}`);

    try {
      return await this.peerEvaluationMappingRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`동료평가 매핑 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 동료평가 매핑 목록을 조회한다
   */
  async 필터_조회한다(
    filter: PeerEvaluationMappingFilter,
  ): Promise<PeerEvaluationMapping[]> {
    this.logger.debug(
      `동료평가 매핑 필터 조회 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      let queryBuilder =
        this.peerEvaluationMappingRepository.createQueryBuilder('mapping');

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

      if (filter.periodId) {
        queryBuilder.andWhere('mapping.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.peerEvaluationId) {
        queryBuilder.andWhere('mapping.peerEvaluationId = :peerEvaluationId', {
          peerEvaluationId: filter.peerEvaluationId,
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
        `동료평가 매핑 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 피평가자의 동료평가 매핑을 조회한다
   */
  async 피평가자별_조회한다(
    employeeId: string,
  ): Promise<PeerEvaluationMapping[]> {
    this.logger.debug(
      `피평가자별 동료평가 매핑 조회 - 피평가자: ${employeeId}`,
    );

    try {
      return await this.필터_조회한다({ employeeId });
    } catch (error) {
      this.logger.error(
        `피평가자별 동료평가 매핑 조회 실패 - 피평가자: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가자의 동료평가 매핑을 조회한다
   */
  async 평가자별_조회한다(
    evaluatorId: string,
  ): Promise<PeerEvaluationMapping[]> {
    this.logger.debug(`평가자별 동료평가 매핑 조회 - 평가자: ${evaluatorId}`);

    try {
      return await this.필터_조회한다({ evaluatorId });
    } catch (error) {
      this.logger.error(
        `평가자별 동료평가 매핑 조회 실패 - 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가기간의 동료평가 매핑을 조회한다
   */
  async 평가기간별_조회한다(
    periodId: string,
  ): Promise<PeerEvaluationMapping[]> {
    this.logger.debug(`평가기간별 동료평가 매핑 조회 - 기간: ${periodId}`);

    try {
      return await this.필터_조회한다({ periodId });
    } catch (error) {
      this.logger.error(
        `평가기간별 동료평가 매핑 조회 실패 - 기간: ${periodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 자기 자신 평가 방지 검사
   */
  private 자기_자신_평가_방지_검사(
    employeeId: string,
    evaluatorId: string,
  ): void {
    if (employeeId === evaluatorId) {
      throw new SelfPeerEvaluationMappingException(employeeId);
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
    const existing = await this.peerEvaluationMappingRepository.findOne({
      where: {
        employeeId,
        evaluatorId,
        periodId,
      },
    });

    if (existing) {
      throw new PeerEvaluationMappingDuplicateException(
        employeeId,
        evaluatorId,
        periodId,
      );
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreatePeerEvaluationMappingData): void {
    if (!data.employeeId) {
      throw new PeerEvaluationMappingValidationException(
        '피평가자 ID는 필수입니다.',
      );
    }

    if (!data.evaluatorId) {
      throw new PeerEvaluationMappingValidationException(
        '평가자 ID는 필수입니다.',
      );
    }

    if (!data.periodId) {
      throw new PeerEvaluationMappingValidationException(
        '평가 기간 ID는 필수입니다.',
      );
    }

    if (!data.peerEvaluationId) {
      throw new PeerEvaluationMappingValidationException(
        '동료평가 ID는 필수입니다.',
      );
    }

    if (!data.mappedBy) {
      throw new PeerEvaluationMappingValidationException(
        '매핑자 ID는 필수입니다.',
      );
    }
  }
}
