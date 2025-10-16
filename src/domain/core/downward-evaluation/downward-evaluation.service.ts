import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from './downward-evaluation.entity';
import {
  DownwardEvaluationNotFoundException,
  DownwardEvaluationValidationException,
  DownwardEvaluationDuplicateException,
} from './downward-evaluation.exceptions';
import type {
  CreateDownwardEvaluationData,
  UpdateDownwardEvaluationData,
  DownwardEvaluationFilter,
} from './downward-evaluation.types';
import { DownwardEvaluationType } from './downward-evaluation.types';

/**
 * 하향평가 서비스
 * 하향평가 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class DownwardEvaluationService {
  private readonly logger = new Logger(DownwardEvaluationService.name);

  constructor(
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
  ) {}

  /**
   * 하향평가를 생성한다
   */
  async 생성한다(
    createData: CreateDownwardEvaluationData,
  ): Promise<DownwardEvaluation> {
    this.logger.log(
      `하향평가 생성 시작 - 피평가자: ${createData.employeeId}, 평가자: ${createData.evaluatorId}, 유형: ${createData.evaluationType}`,
    );

    // 중복 검사
    await this.중복_검사를_수행한다(
      createData.employeeId,
      createData.evaluatorId,
      createData.periodId,
      createData.evaluationType,
    );

    // 유효성 검사
    this.유효성을_검사한다(createData);

    try {
      const downwardEvaluation = new DownwardEvaluation(createData);
      const saved =
        await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `하향평가 생성 실패 - 유형: ${createData.evaluationType}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 하향평가를 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateDownwardEvaluationData,
    updatedBy: string,
  ): Promise<DownwardEvaluation> {
    this.logger.log(`하향평가 수정 시작 - ID: ${id}`);

    const downwardEvaluation = await this.조회한다(id);
    if (!downwardEvaluation) {
      throw new DownwardEvaluationNotFoundException(id);
    }

    try {
      downwardEvaluation.하향평가를_수정한다(
        updateData.downwardEvaluationContent,
        updateData.downwardEvaluationScore,
        updatedBy,
      );

      // 완료 상태 변경 처리
      if (updateData.isCompleted !== undefined) {
        if (updateData.isCompleted) {
          downwardEvaluation.평가를_완료한다(updatedBy);
        } else {
          downwardEvaluation.isCompleted = false;
          downwardEvaluation.completedAt = undefined;
          downwardEvaluation.메타데이터를_업데이트한다(updatedBy);
        }
      }

      // 자기평가 연결/해제 처리
      if (updateData.selfEvaluationId !== undefined) {
        if (updateData.selfEvaluationId) {
          downwardEvaluation.자기평가를_연결한다(
            updateData.selfEvaluationId,
            updatedBy,
          );
        } else {
          downwardEvaluation.자기평가_연결을_해제한다(updatedBy);
        }
      }

      const saved =
        await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`하향평가 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 하향평가를 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`하향평가 삭제 시작 - ID: ${id}`);

    const downwardEvaluation = await this.조회한다(id);
    if (!downwardEvaluation) {
      throw new DownwardEvaluationNotFoundException(id);
    }

    try {
      downwardEvaluation.메타데이터를_업데이트한다(deletedBy);
      downwardEvaluation.삭제한다();

      await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`하향평가 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 하향평가를 조회한다
   */
  async 조회한다(id: string): Promise<DownwardEvaluation | null> {
    this.logger.debug(`하향평가 조회 - ID: ${id}`);

    try {
      return await this.downwardEvaluationRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`하향평가 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 하향평가 목록을 조회한다
   */
  async 필터_조회한다(
    filter: DownwardEvaluationFilter,
  ): Promise<DownwardEvaluation[]> {
    this.logger.debug(`하향평가 필터 조회 - 필터: ${JSON.stringify(filter)}`);

    try {
      let queryBuilder =
        this.downwardEvaluationRepository.createQueryBuilder('evaluation');

      // 필터 적용
      if (filter.employeeId) {
        queryBuilder.andWhere('evaluation.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.evaluatorId) {
        queryBuilder.andWhere('evaluation.evaluatorId = :evaluatorId', {
          evaluatorId: filter.evaluatorId,
        });
      }

      if (filter.projectId) {
        queryBuilder.andWhere('evaluation.projectId = :projectId', {
          projectId: filter.projectId,
        });
      }

      if (filter.periodId) {
        queryBuilder.andWhere('evaluation.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.selfEvaluationId) {
        queryBuilder.andWhere(
          'evaluation.selfEvaluationId = :selfEvaluationId',
          {
            selfEvaluationId: filter.selfEvaluationId,
          },
        );
      }

      if (filter.evaluationType) {
        queryBuilder.andWhere('evaluation.evaluationType = :evaluationType', {
          evaluationType: filter.evaluationType,
        });
      }

      if (filter.withSelfEvaluation) {
        queryBuilder.andWhere('evaluation.selfEvaluationId IS NOT NULL');
      }

      if (filter.withoutSelfEvaluation) {
        queryBuilder.andWhere('evaluation.selfEvaluationId IS NULL');
      }

      if (filter.completedOnly) {
        queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
          isCompleted: true,
        });
      }

      if (filter.uncompletedOnly) {
        queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
          isCompleted: false,
        });
      }

      if (filter.scoreFrom !== undefined) {
        queryBuilder.andWhere(
          'evaluation.downwardEvaluationScore >= :scoreFrom',
          {
            scoreFrom: filter.scoreFrom,
          },
        );
      }

      if (filter.scoreTo !== undefined) {
        queryBuilder.andWhere(
          'evaluation.downwardEvaluationScore <= :scoreTo',
          {
            scoreTo: filter.scoreTo,
          },
        );
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
        `하향평가 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 하향평가를 완료로 표시한다
   */
  async 완료한다(id: string, completedBy: string): Promise<DownwardEvaluation> {
    this.logger.log(`하향평가 완료 처리 시작 - ID: ${id}`);

    const downwardEvaluation = await this.조회한다(id);
    if (!downwardEvaluation) {
      throw new DownwardEvaluationNotFoundException(id);
    }

    try {
      downwardEvaluation.평가를_완료한다(completedBy);

      const saved =
        await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 완료 처리 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`하향평가 완료 처리 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 특정 피평가자의 하향평가 목록을 조회한다
   */
  async 피평가자별_조회한다(employeeId: string): Promise<DownwardEvaluation[]> {
    this.logger.debug(`피평가자별 하향평가 조회 - 피평가자: ${employeeId}`);

    try {
      return await this.필터_조회한다({ employeeId });
    } catch (error) {
      this.logger.error(
        `피평가자별 하향평가 조회 실패 - 피평가자: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가자의 하향평가 목록을 조회한다
   */
  async 평가자별_조회한다(evaluatorId: string): Promise<DownwardEvaluation[]> {
    this.logger.debug(`평가자별 하향평가 조회 - 평가자: ${evaluatorId}`);

    try {
      return await this.필터_조회한다({ evaluatorId });
    } catch (error) {
      this.logger.error(
        `평가자별 하향평가 조회 실패 - 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 프로젝트의 하향평가 목록을 조회한다
   */
  async 프로젝트별_조회한다(projectId: string): Promise<DownwardEvaluation[]> {
    this.logger.debug(`프로젝트별 하향평가 조회 - 프로젝트: ${projectId}`);

    try {
      return await this.필터_조회한다({ projectId });
    } catch (error) {
      this.logger.error(
        `프로젝트별 하향평가 조회 실패 - 프로젝트: ${projectId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가기간의 하향평가 목록을 조회한다
   */
  async 평가기간별_조회한다(periodId: string): Promise<DownwardEvaluation[]> {
    this.logger.debug(`평가기간별 하향평가 조회 - 기간: ${periodId}`);

    try {
      return await this.필터_조회한다({ periodId });
    } catch (error) {
      this.logger.error(
        `평가기간별 하향평가 조회 실패 - 기간: ${periodId}`,
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
    evaluationType: DownwardEvaluationType,
  ): Promise<void> {
    const existing = await this.downwardEvaluationRepository.findOne({
      where: {
        employeeId,
        evaluatorId,
        periodId,
        evaluationType,
      },
    });

    if (existing) {
      throw new DownwardEvaluationDuplicateException(
        employeeId,
        evaluatorId,
        periodId,
      );
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateDownwardEvaluationData): void {
    if (!data.employeeId) {
      throw new DownwardEvaluationValidationException(
        '피평가자 ID는 필수입니다.',
      );
    }

    if (!data.evaluatorId) {
      throw new DownwardEvaluationValidationException(
        '평가자 ID는 필수입니다.',
      );
    }

    if (!data.projectId) {
      throw new DownwardEvaluationValidationException(
        '프로젝트 ID는 필수입니다.',
      );
    }

    if (!data.periodId) {
      throw new DownwardEvaluationValidationException(
        '평가 기간 ID는 필수입니다.',
      );
    }

    if (!data.evaluationType) {
      throw new DownwardEvaluationValidationException(
        '평가 유형은 필수입니다.',
      );
    }
  }
}
