import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import type { FinalEvaluationDto } from '@domain/core/final-evaluation/final-evaluation.types';

/**
 * 직원-평가기간별 최종평가 조회 쿼리
 */
export class GetFinalEvaluationByEmployeePeriodQuery {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * 직원-평가기간별 최종평가 조회 핸들러
 */
@Injectable()
@QueryHandler(GetFinalEvaluationByEmployeePeriodQuery)
export class GetFinalEvaluationByEmployeePeriodHandler
  implements IQueryHandler<GetFinalEvaluationByEmployeePeriodQuery>
{
  private readonly logger = new Logger(
    GetFinalEvaluationByEmployeePeriodHandler.name,
  );

  constructor(
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
  ) {}

  async execute(
    query: GetFinalEvaluationByEmployeePeriodQuery,
  ): Promise<FinalEvaluationDto | null> {
    const { employeeId, periodId } = query;

    this.logger.log('직원-평가기간별 최종평가 조회 핸들러 실행', {
      employeeId,
      periodId,
    });

    const evaluation = await this.finalEvaluationRepository.findOne({
      where: {
        employeeId,
        periodId,
      },
    });

    if (!evaluation) {
      this.logger.log('최종평가를 찾을 수 없음', { employeeId, periodId });
      return null;
    }

    this.logger.log('직원-평가기간별 최종평가 조회 완료', {
      evaluationId: evaluation.id,
    });

    return evaluation.DTO로_변환한다();
  }
}
