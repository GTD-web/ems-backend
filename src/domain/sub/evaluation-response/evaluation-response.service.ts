import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationResponse } from './evaluation-response.entity';
import {
  EvaluationResponseNotFoundException,
  DuplicateEvaluationResponseException,
} from './evaluation-response.exceptions';
import type {
  CreateEvaluationResponseDto,
  UpdateEvaluationResponseDto,
  EvaluationResponseFilter,
  EvaluationResponseType,
  EvaluationResponseStats,
} from './evaluation-response.types';

/**
 * 평가 응답 서비스
 * 평가 질문에 대한 응답을 관리합니다.
 */
@Injectable()
export class EvaluationResponseService {
  private readonly logger = new Logger(EvaluationResponseService.name);

  constructor(
    @InjectRepository(EvaluationResponse)
    private readonly evaluationResponseRepository: Repository<EvaluationResponse>,
  ) {}

  /**
   * ID로 평가 응답을 조회한다
   */
  async ID로조회한다(id: string): Promise<EvaluationResponse | null> {
    this.logger.log(`평가 응답 조회 - ID: ${id}`);
    return await this.evaluationResponseRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * 질문별 평가 응답을 조회한다
   */
  async 질문별조회한다(questionId: string): Promise<EvaluationResponse[]> {
    this.logger.log(`평가 응답 조회 - 질문 ID: ${questionId}`);
    return await this.evaluationResponseRepository.find({
      where: { questionId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 평가별 응답을 조회한다
   */
  async 평가별조회한다(evaluationId: string): Promise<EvaluationResponse[]> {
    this.logger.log(`평가 응답 조회 - 평가 ID: ${evaluationId}`);
    return await this.evaluationResponseRepository.find({
      where: { evaluationId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 질문과 평가로 응답을 조회한다
   */
  async 질문평가별조회한다(
    questionId: string,
    evaluationId: string,
  ): Promise<EvaluationResponse | null> {
    this.logger.log(
      `평가 응답 조회 - 질문 ID: ${questionId}, 평가 ID: ${evaluationId}`,
    );
    return await this.evaluationResponseRepository.findOne({
      where: { questionId, evaluationId, deletedAt: IsNull() },
    });
  }

  /**
   * 평가 유형별 응답을 조회한다
   */
  async 평가유형별조회한다(
    evaluationType: EvaluationResponseType,
  ): Promise<EvaluationResponse[]> {
    this.logger.log(`평가 응답 조회 - 평가 유형: ${evaluationType}`);
    return await this.evaluationResponseRepository.find({
      where: { evaluationType, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 평가와 유형으로 응답을 조회한다
   */
  async 평가유형조합조회한다(
    evaluationId: string,
    evaluationType: EvaluationResponseType,
  ): Promise<EvaluationResponse[]> {
    this.logger.log(
      `평가 응답 조회 - 평가 ID: ${evaluationId}, 평가 유형: ${evaluationType}`,
    );
    return await this.evaluationResponseRepository.find({
      where: { evaluationId, evaluationType, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 모든 평가 응답을 조회한다
   */
  async 전체조회한다(): Promise<EvaluationResponse[]> {
    this.logger.log('전체 평가 응답 조회');
    return await this.evaluationResponseRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 필터 조건으로 평가 응답을 조회한다
   */
  async 필터조회한다(
    filter: EvaluationResponseFilter,
  ): Promise<EvaluationResponse[]> {
    this.logger.log('필터 조건으로 평가 응답 조회', filter);

    const queryBuilder = this.evaluationResponseRepository
      .createQueryBuilder('response')
      .where('response.deletedAt IS NULL');

    if (filter.questionId) {
      queryBuilder.andWhere('response.questionId = :questionId', {
        questionId: filter.questionId,
      });
    }

    if (filter.evaluationId) {
      queryBuilder.andWhere('response.evaluationId = :evaluationId', {
        evaluationId: filter.evaluationId,
      });
    }

    if (filter.evaluationType) {
      queryBuilder.andWhere('response.evaluationType = :evaluationType', {
        evaluationType: filter.evaluationType,
      });
    }

    if (filter.answerSearch) {
      queryBuilder.andWhere('response.answer LIKE :answerSearch', {
        answerSearch: `%${filter.answerSearch}%`,
      });
    }

    if (filter.minScore !== undefined) {
      queryBuilder.andWhere('response.score >= :minScore', {
        minScore: filter.minScore,
      });
    }

    if (filter.maxScore !== undefined) {
      queryBuilder.andWhere('response.score <= :maxScore', {
        maxScore: filter.maxScore,
      });
    }

    queryBuilder.orderBy('response.createdAt', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * 평가 응답을 생성한다
   */
  async 생성한다(
    createDto: CreateEvaluationResponseDto,
    createdBy: string,
  ): Promise<EvaluationResponse> {
    this.logger.log(
      `평가 응답 생성 시작 - 질문 ID: ${createDto.questionId}, 평가 ID: ${createDto.evaluationId}`,
    );

    // 중복 검사
    const exists = await this.응답중복확인한다(
      createDto.questionId,
      createDto.evaluationId,
    );
    if (exists) {
      throw new DuplicateEvaluationResponseException(
        createDto.questionId,
        createDto.evaluationId,
      );
    }

    try {
      const evaluationResponse = new EvaluationResponse({
        ...createDto,
        createdBy,
      });
      const saved =
        await this.evaluationResponseRepository.save(evaluationResponse);

      this.logger.log(`평가 응답 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `평가 응답 생성 실패 - 질문 ID: ${createDto.questionId}, 평가 ID: ${createDto.evaluationId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가 응답을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateDto: UpdateEvaluationResponseDto,
    updatedBy: string,
  ): Promise<EvaluationResponse> {
    this.logger.log(`평가 응답 수정 시작 - ID: ${id}`);

    const evaluationResponse = await this.ID로조회한다(id);
    if (!evaluationResponse) {
      throw new EvaluationResponseNotFoundException(id);
    }

    try {
      if (updateDto.answer !== undefined && updateDto.score !== undefined) {
        evaluationResponse.응답전체업데이트한다(
          updateDto.answer,
          updateDto.score,
          updatedBy,
        );
      } else if (updateDto.answer !== undefined) {
        evaluationResponse.응답내용업데이트한다(updateDto.answer, updatedBy);
      } else if (updateDto.score !== undefined) {
        evaluationResponse.응답점수업데이트한다(updateDto.score, updatedBy);
      }

      const saved =
        await this.evaluationResponseRepository.save(evaluationResponse);
      this.logger.log(`평가 응답 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`평가 응답 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 평가 응답을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`평가 응답 삭제 시작 - ID: ${id}`);

    const evaluationResponse = await this.ID로조회한다(id);
    if (!evaluationResponse) {
      throw new EvaluationResponseNotFoundException(id);
    }

    try {
      evaluationResponse.deletedAt = new Date();
      evaluationResponse.메타데이터를_업데이트한다(deletedBy);
      await this.evaluationResponseRepository.save(evaluationResponse);

      this.logger.log(`평가 응답 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`평가 응답 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 질문의 모든 응답을 삭제한다
   */
  async 질문응답전체삭제한다(
    questionId: string,
    deletedBy: string,
  ): Promise<void> {
    this.logger.log(`질문의 모든 응답 삭제 시작 - 질문 ID: ${questionId}`);

    const responses = await this.질문별조회한다(questionId);

    try {
      for (const response of responses) {
        response.deletedAt = new Date();
        response.메타데이터를_업데이트한다(deletedBy);
      }

      await this.evaluationResponseRepository.save(responses);
      this.logger.log(
        `질문의 모든 응답 삭제 완료 - 질문 ID: ${questionId}, 삭제 개수: ${responses.length}`,
      );
    } catch (error) {
      this.logger.error(
        `질문의 모든 응답 삭제 실패 - 질문 ID: ${questionId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가의 모든 응답을 삭제한다
   */
  async 평가응답전체삭제한다(
    evaluationId: string,
    deletedBy: string,
  ): Promise<void> {
    this.logger.log(`평가의 모든 응답 삭제 시작 - 평가 ID: ${evaluationId}`);

    const responses = await this.평가별조회한다(evaluationId);

    try {
      for (const response of responses) {
        response.deletedAt = new Date();
        response.메타데이터를_업데이트한다(deletedBy);
      }

      await this.evaluationResponseRepository.save(responses);
      this.logger.log(
        `평가의 모든 응답 삭제 완료 - 평가 ID: ${evaluationId}, 삭제 개수: ${responses.length}`,
      );
    } catch (error) {
      this.logger.error(
        `평가의 모든 응답 삭제 실패 - 평가 ID: ${evaluationId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 질문과 평가 조합의 응답 중복을 확인한다
   */
  async 응답중복확인한다(
    questionId: string,
    evaluationId: string,
  ): Promise<boolean> {
    const count = await this.evaluationResponseRepository.count({
      where: { questionId, evaluationId, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 질문의 응답 개수를 조회한다
   */
  async 질문응답개수조회한다(questionId: string): Promise<number> {
    return await this.evaluationResponseRepository.count({
      where: { questionId, deletedAt: IsNull() },
    });
  }

  /**
   * 평가의 응답 개수를 조회한다
   */
  async 평가응답개수조회한다(evaluationId: string): Promise<number> {
    return await this.evaluationResponseRepository.count({
      where: { evaluationId, deletedAt: IsNull() },
    });
  }

  /**
   * 평가 유형별 응답 개수를 조회한다
   */
  async 평가유형별응답개수조회한다(
    evaluationType: EvaluationResponseType,
  ): Promise<number> {
    return await this.evaluationResponseRepository.count({
      where: { evaluationType, deletedAt: IsNull() },
    });
  }

  /**
   * 질문의 응답 통계를 조회한다
   */
  async 질문응답통계조회한다(
    questionId: string,
  ): Promise<EvaluationResponseStats> {
    const responses = await this.질문별조회한다(questionId);
    return this.통계를_계산한다(responses);
  }

  /**
   * 평가의 응답 통계를 조회한다
   */
  async 평가응답통계조회한다(
    evaluationId: string,
  ): Promise<EvaluationResponseStats> {
    const responses = await this.평가별조회한다(evaluationId);
    return this.통계를_계산한다(responses);
  }

  /**
   * 평가 유형별 응답 통계를 조회한다
   */
  async 평가유형별응답통계조회한다(
    evaluationType: EvaluationResponseType,
  ): Promise<EvaluationResponseStats> {
    const responses = await this.평가유형별조회한다(evaluationType);
    return this.통계를_계산한다(responses);
  }

  /**
   * 평가의 완료율을 조회한다 (응답한 질문 수 / 전체 질문 수)
   */
  async 평가완료율조회한다(evaluationId: string): Promise<number> {
    // 전체 질문 수는 QuestionGroup과 QuestionGroupMapping을 통해 확인 필요
    // 현재는 간단하게 100% 반환
    return 100;
  }

  /**
   * 평가가 완료되었는지 확인한다
   */
  async 평가완료확인한다(evaluationId: string): Promise<boolean> {
    const completionRate = await this.평가완료율조회한다(evaluationId);
    return completionRate === 100;
  }

  /**
   * 통계를 계산한다 (private 헬퍼 메서드)
   */
  private 통계를_계산한다(
    responses: EvaluationResponse[],
  ): EvaluationResponseStats {
    const totalCount = responses.length;
    const scores = responses
      .filter((r) => r.score !== undefined)
      .map((r) => r.score!);

    // 평가 유형별 개수 계산
    const countByType: Record<EvaluationResponseType, number> = {
      self: 0,
      peer: 0,
      additional: 0,
      downward: 0,
    };

    responses.forEach((response) => {
      countByType[response.evaluationType] =
        (countByType[response.evaluationType] || 0) + 1;
    });

    const stats: EvaluationResponseStats = {
      totalCount,
      countByType,
    };

    if (scores.length > 0) {
      stats.averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      stats.maxScore = Math.max(...scores);
      stats.minScore = Math.min(...scores);
    }

    return stats;
  }
}
