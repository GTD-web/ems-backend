import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeerEvaluation } from './peer-evaluation.entity';
import {
  PeerEvaluationNotFoundException,
  PeerEvaluationValidationException,
  PeerEvaluationDuplicateException,
  SelfPeerEvaluationException,
} from './peer-evaluation.exceptions';
import type {
  CreatePeerEvaluationData,
  UpdatePeerEvaluationData,
  PeerEvaluationFilter,
} from './peer-evaluation.types';

/**
 * 동료평가 서비스
 * 동료평가 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class PeerEvaluationService {
  private readonly logger = new Logger(PeerEvaluationService.name);

  constructor(
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
  ) {}

  /**
   * 동료평가를 생성한다
   */
  async 생성한다(
    createData: CreatePeerEvaluationData,
  ): Promise<PeerEvaluation> {
    this.logger.log(
      `동료평가 생성 시작 - 피평가자: ${createData.employeeId}, 평가자: ${createData.evaluatorId}`,
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
      const peerEvaluation = new PeerEvaluation(createData);
      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `동료평가 생성 실패 - 피평가자: ${createData.employeeId}, 평가자: ${createData.evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 동료평가를 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdatePeerEvaluationData,
    updatedBy: string,
  ): Promise<PeerEvaluation> {
    this.logger.log(`동료평가 수정 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    // 유효성 검사
    if (updateData.score !== undefined) {
      this.점수_유효성을_검사한다(updateData.score);
    }

    try {
      peerEvaluation.동료평가를_수정한다(
        updateData.evaluationContent,
        updateData.score,
        updatedBy,
      );

      // 상태 변경 처리
      if (updateData.status !== undefined) {
        if (updateData.status === 'completed') {
          peerEvaluation.평가를_완료한다(updatedBy);
        } else if (updateData.status === 'in_progress') {
          peerEvaluation.진행중으로_변경한다(updatedBy);
        } else {
          peerEvaluation.status = updateData.status;
          peerEvaluation.메타데이터를_업데이트한다(updatedBy);
        }
      }

      // 완료 상태 변경 처리
      if (updateData.isCompleted !== undefined) {
        if (updateData.isCompleted) {
          peerEvaluation.평가를_완료한다(updatedBy);
        } else {
          peerEvaluation.isCompleted = false;
          peerEvaluation.completedAt = undefined;
          peerEvaluation.메타데이터를_업데이트한다(updatedBy);
        }
      }

      // 활성 상태 변경 처리
      if (updateData.isActive !== undefined) {
        if (updateData.isActive) {
          peerEvaluation.활성화한다(updatedBy);
        } else {
          peerEvaluation.비활성화한다(updatedBy);
        }
      }

      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 동료평가를 취소한다
   */
  async 취소한다(id: string, cancelledBy: string): Promise<PeerEvaluation> {
    this.logger.log(`동료평가 취소 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    try {
      peerEvaluation.취소한다(cancelledBy);
      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 취소 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 취소 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 여러 동료평가를 일괄 취소한다
   */
  async 일괄_취소한다(
    ids: string[],
    cancelledBy: string,
  ): Promise<PeerEvaluation[]> {
    this.logger.log(`동료평가 일괄 취소 시작 - 대상 개수: ${ids.length}개`);

    try {
      const evaluations = await this.peerEvaluationRepository.findByIds(ids);

      if (evaluations.length === 0) {
        this.logger.warn(`취소할 동료평가를 찾을 수 없습니다.`);
        return [];
      }

      evaluations.forEach((evaluation) => {
        evaluation.취소한다(cancelledBy);
      });

      const saved = await this.peerEvaluationRepository.save(evaluations);

      this.logger.log(
        `동료평가 일괄 취소 완료 - 취소된 개수: ${saved.length}개`,
      );
      return saved;
    } catch (error) {
      this.logger.error(
        `동료평가 일괄 취소 실패 - 대상 개수: ${ids.length}개`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 동료평가를 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`동료평가 삭제 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    try {
      peerEvaluation.메타데이터를_업데이트한다(deletedBy);
      peerEvaluation.삭제한다();

      await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`동료평가 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 동료평가를 조회한다
   */
  async 조회한다(id: string): Promise<PeerEvaluation | null> {
    this.logger.debug(`동료평가 조회 - ID: ${id}`);

    try {
      return await this.peerEvaluationRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`동료평가 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 동료평가 목록을 조회한다
   */
  async 필터_조회한다(filter: PeerEvaluationFilter): Promise<PeerEvaluation[]> {
    this.logger.debug(`동료평가 필터 조회 - 필터: ${JSON.stringify(filter)}`);

    try {
      let queryBuilder =
        this.peerEvaluationRepository.createQueryBuilder('evaluation');

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

      if (filter.periodId) {
        queryBuilder.andWhere('evaluation.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.mappedBy) {
        queryBuilder.andWhere('evaluation.mappedBy = :mappedBy', {
          mappedBy: filter.mappedBy,
        });
      }

      if (filter.status) {
        queryBuilder.andWhere('evaluation.status = :status', {
          status: filter.status,
        });
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

      if (filter.pendingOnly) {
        queryBuilder.andWhere('evaluation.status = :status', {
          status: 'pending',
        });
      }

      if (filter.inProgressOnly) {
        queryBuilder.andWhere('evaluation.status = :status', {
          status: 'in_progress',
        });
      }

      if (filter.activeOnly) {
        queryBuilder.andWhere('evaluation.isActive = :isActive', {
          isActive: true,
        });
      }

      if (filter.inactiveOnly) {
        queryBuilder.andWhere('evaluation.isActive = :isActive', {
          isActive: false,
        });
      }

      if (filter.scoreFrom !== undefined) {
        queryBuilder.andWhere('evaluation.score >= :scoreFrom', {
          scoreFrom: filter.scoreFrom,
        });
      }

      if (filter.scoreTo !== undefined) {
        queryBuilder.andWhere('evaluation.score <= :scoreTo', {
          scoreTo: filter.scoreTo,
        });
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

      if (filter.mappedDateFrom) {
        queryBuilder.andWhere('evaluation.mappedDate >= :mappedDateFrom', {
          mappedDateFrom: filter.mappedDateFrom,
        });
      }

      if (filter.mappedDateTo) {
        queryBuilder.andWhere('evaluation.mappedDate <= :mappedDateTo', {
          mappedDateTo: filter.mappedDateTo,
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
    } catch (error) {
      this.logger.error(
        `동료평가 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 동료평가를 완료로 표시한다
   */
  async 완료한다(id: string, completedBy: string): Promise<PeerEvaluation> {
    this.logger.log(`동료평가 완료 처리 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    try {
      peerEvaluation.평가를_완료한다(completedBy);

      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 완료 처리 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 완료 처리 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 동료평가를 진행중으로 변경한다
   */
  async 진행중으로_변경한다(
    id: string,
    updatedBy: string,
  ): Promise<PeerEvaluation> {
    this.logger.log(`동료평가 진행중 변경 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    try {
      peerEvaluation.진행중으로_변경한다(updatedBy);

      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 진행중 변경 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 진행중 변경 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 특정 피평가자의 동료평가를 조회한다
   */
  async 피평가자별_조회한다(employeeId: string): Promise<PeerEvaluation[]> {
    this.logger.debug(`피평가자별 동료평가 조회 - 피평가자: ${employeeId}`);

    try {
      return await this.필터_조회한다({ employeeId });
    } catch (error) {
      this.logger.error(
        `피평가자별 동료평가 조회 실패 - 피평가자: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가자의 동료평가를 조회한다
   */
  async 평가자별_조회한다(evaluatorId: string): Promise<PeerEvaluation[]> {
    this.logger.debug(`평가자별 동료평가 조회 - 평가자: ${evaluatorId}`);

    try {
      return await this.필터_조회한다({ evaluatorId });
    } catch (error) {
      this.logger.error(
        `평가자별 동료평가 조회 실패 - 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가기간의 동료평가를 조회한다
   */
  async 평가기간별_조회한다(periodId: string): Promise<PeerEvaluation[]> {
    this.logger.debug(`평가기간별 동료평가 조회 - 기간: ${periodId}`);

    try {
      return await this.필터_조회한다({ periodId });
    } catch (error) {
      this.logger.error(
        `평가기간별 동료평가 조회 실패 - 기간: ${periodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 활성화한다
   */
  async 활성화한다(id: string, activatedBy: string): Promise<PeerEvaluation> {
    this.logger.log(`동료평가 활성화 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    try {
      peerEvaluation.활성화한다(activatedBy);
      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 활성화 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 활성화 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 비활성화한다
   */
  async 비활성화한다(
    id: string,
    deactivatedBy: string,
  ): Promise<PeerEvaluation> {
    this.logger.log(`동료평가 비활성화 시작 - ID: ${id}`);

    const peerEvaluation = await this.조회한다(id);
    if (!peerEvaluation) {
      throw new PeerEvaluationNotFoundException(id);
    }

    try {
      peerEvaluation.비활성화한다(deactivatedBy);
      const saved = await this.peerEvaluationRepository.save(peerEvaluation);

      this.logger.log(`동료평가 비활성화 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`동료평가 비활성화 실패 - ID: ${id}`, error.stack);
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
      throw new SelfPeerEvaluationException(employeeId);
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
    const existing = await this.peerEvaluationRepository.findOne({
      where: {
        employeeId,
        evaluatorId,
        periodId,
      },
    });

    if (existing) {
      throw new PeerEvaluationDuplicateException(
        evaluatorId,
        employeeId,
        periodId,
      );
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreatePeerEvaluationData): void {
    if (!data.employeeId) {
      throw new PeerEvaluationValidationException('피평가자 ID는 필수입니다.');
    }

    if (!data.evaluatorId) {
      throw new PeerEvaluationValidationException('평가자 ID는 필수입니다.');
    }

    if (!data.periodId) {
      throw new PeerEvaluationValidationException('평가 기간 ID는 필수입니다.');
    }

    if (data.score !== undefined) {
      this.점수_유효성을_검사한다(data.score);
    }
  }

  /**
   * 점수 유효성을 검사한다
   */
  private 점수_유효성을_검사한다(score: number): void {
    if (score < 1 || score > 5) {
      throw new PeerEvaluationValidationException(
        '동료평가 점수는 1-5 사이여야 합니다.',
      );
    }
  }
}
