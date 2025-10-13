import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import type { FinalEvaluationDto } from '@domain/core/final-evaluation/final-evaluation.types';

/**
 * 최종평가 조회 쿼리
 */
export class GetFinalEvaluationQuery {
  constructor(public readonly id: string) {}
}

/**
 * 최종평가 조회 핸들러
 */
@Injectable()
@QueryHandler(GetFinalEvaluationQuery)
export class GetFinalEvaluationHandler
  implements IQueryHandler<GetFinalEvaluationQuery>
{
  private readonly logger = new Logger(GetFinalEvaluationHandler.name);

  constructor(
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
  ) {}

  async execute(query: GetFinalEvaluationQuery): Promise<FinalEvaluationDto> {
    const { id } = query;

    this.logger.log('최종평가 조회 핸들러 실행', { id });

    const evaluation = await this.finalEvaluationRepository.findOne({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundException(`최종평가를 찾을 수 없습니다: ${id}`);
    }

    this.logger.log('최종평가 조회 완료', { id });

    return evaluation.DTO로_변환한다();
  }
}
