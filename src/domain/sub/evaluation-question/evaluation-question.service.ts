import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationQuestion } from './evaluation-question.entity';
import {
  EvaluationQuestionNotFoundException,
  DuplicateEvaluationQuestionException,
  QuestionWithResponsesException,
} from './evaluation-question.exceptions';
import type {
  CreateEvaluationQuestionDto,
  UpdateEvaluationQuestionDto,
  EvaluationQuestionFilter,
} from './evaluation-question.types';
import type { IEvaluationQuestionService } from './interfaces/evaluation-question.service.interface';

/**
 * 평가 질문 서비스
 * 평가 질문 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EvaluationQuestionService implements IEvaluationQuestionService {
  private readonly logger = new Logger(EvaluationQuestionService.name);

  constructor(
    @InjectRepository(EvaluationQuestion)
    private readonly evaluationQuestionRepository: Repository<EvaluationQuestion>,
  ) {}

  /**
   * ID로 평가 질문을 조회한다
   */
  async ID로조회한다(id: string): Promise<EvaluationQuestion | null> {
    this.logger.log(`평가 질문 조회 - ID: ${id}`);
    return await this.evaluationQuestionRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * 질문 내용으로 평가 질문을 조회한다
   */
  async 질문내용으로조회한다(text: string): Promise<EvaluationQuestion | null> {
    this.logger.log(`평가 질문 조회 - 질문 내용: ${text}`);
    return await this.evaluationQuestionRepository.findOne({
      where: { text, deletedAt: IsNull() },
    });
  }

  /**
   * 모든 평가 질문을 조회한다
   */
  async 전체조회한다(): Promise<EvaluationQuestion[]> {
    this.logger.log('전체 평가 질문 조회');
    return await this.evaluationQuestionRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 필터 조건으로 평가 질문을 조회한다
   */
  async 필터조회한다(
    filter: EvaluationQuestionFilter,
  ): Promise<EvaluationQuestion[]> {
    this.logger.log('필터 조건으로 평가 질문 조회', filter);

    const queryBuilder = this.evaluationQuestionRepository
      .createQueryBuilder('question')
      .where('question.deletedAt IS NULL');

    if (filter.textSearch) {
      queryBuilder.andWhere('question.text LIKE :textSearch', {
        textSearch: `%${filter.textSearch}%`,
      });
    }

    queryBuilder.orderBy('question.createdAt', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * 평가 질문을 생성한다
   */
  async 생성한다(
    createDto: CreateEvaluationQuestionDto,
    createdBy: string,
  ): Promise<EvaluationQuestion> {
    this.logger.log(`평가 질문 생성 시작 - 질문 내용: ${createDto.text}`);

    // 질문 내용 중복 검사
    const exists = await this.질문내용중복확인한다(createDto.text);
    if (exists) {
      throw new DuplicateEvaluationQuestionException(createDto.text);
    }

    try {
      const evaluationQuestion = new EvaluationQuestion({
        ...createDto,
        createdBy,
      });
      const saved =
        await this.evaluationQuestionRepository.save(evaluationQuestion);

      this.logger.log(`평가 질문 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `평가 질문 생성 실패 - 질문 내용: ${createDto.text}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가 질문을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateDto: UpdateEvaluationQuestionDto,
    updatedBy: string,
  ): Promise<EvaluationQuestion> {
    this.logger.log(`평가 질문 수정 시작 - ID: ${id}`);

    const evaluationQuestion = await this.ID로조회한다(id);
    if (!evaluationQuestion) {
      throw new EvaluationQuestionNotFoundException(id);
    }

    // 질문 내용 변경 시 중복 검사
    if (updateDto.text && updateDto.text !== evaluationQuestion.text) {
      const exists = await this.질문내용중복확인한다(updateDto.text, id);
      if (exists) {
        throw new DuplicateEvaluationQuestionException(updateDto.text);
      }
    }

    try {
      if (updateDto.text) {
        evaluationQuestion.질문내용업데이트한다(updateDto.text, updatedBy);
      }

      if (
        updateDto.minScore !== undefined &&
        updateDto.maxScore !== undefined
      ) {
        evaluationQuestion.점수범위설정한다(
          updateDto.minScore,
          updateDto.maxScore,
          updatedBy,
        );
      }

      const saved =
        await this.evaluationQuestionRepository.save(evaluationQuestion);
      this.logger.log(`평가 질문 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`평가 질문 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 평가 질문을 삭제한다
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`평가 질문 삭제 시작 - ID: ${id}`);

    const evaluationQuestion = await this.ID로조회한다(id);
    if (!evaluationQuestion) {
      throw new EvaluationQuestionNotFoundException(id);
    }

    // 응답이 있는 질문 삭제 방지
    const hasResponses = await this.질문응답존재확인한다(id);
    if (hasResponses) {
      const responseCount = await this.질문응답개수조회한다(id);
      throw new QuestionWithResponsesException(id, responseCount);
    }

    try {
      evaluationQuestion.deletedAt = new Date();
      evaluationQuestion.메타데이터를_업데이트한다(deletedBy);
      await this.evaluationQuestionRepository.save(evaluationQuestion);

      this.logger.log(`평가 질문 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`평가 질문 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 평가 질문을 복사한다
   */
  async 복사한다(id: string, copiedBy: string): Promise<EvaluationQuestion> {
    this.logger.log(`평가 질문 복사 시작 - ID: ${id}`);

    const evaluationQuestion = await this.ID로조회한다(id);
    if (!evaluationQuestion) {
      throw new EvaluationQuestionNotFoundException(id);
    }

    try {
      const newQuestion = new EvaluationQuestion({
        text: `${evaluationQuestion.text} (복사본)`,
        minScore: evaluationQuestion.minScore,
        maxScore: evaluationQuestion.maxScore,
        createdBy: copiedBy,
      });

      const saved = await this.evaluationQuestionRepository.save(newQuestion);
      this.logger.log(`평가 질문 복사 완료 - 새 ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`평가 질문 복사 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 질문 내용 중복을 확인한다
   */
  async 질문내용중복확인한다(
    text: string,
    excludeId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.evaluationQuestionRepository
      .createQueryBuilder('question')
      .where('question.text = :text', { text })
      .andWhere('question.deletedAt IS NULL');

    if (excludeId) {
      queryBuilder.andWhere('question.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 질문에 응답이 있는지 확인한다
   */
  async 질문응답존재확인한다(questionId: string): Promise<boolean> {
    // EvaluationResponse를 통해 확인 필요
    // 현재는 false 반환
    return false;
  }

  /**
   * 질문의 응답 개수를 조회한다
   */
  async 질문응답개수조회한다(questionId: string): Promise<number> {
    // EvaluationResponse를 통해 확인 필요
    // 현재는 0 반환
    return 0;
  }
}
