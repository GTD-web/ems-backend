import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import type { DownwardEvaluationDto } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 하향평가 상세정보 조회 쿼리
 */
export class GetDownwardEvaluationDetailQuery {
  constructor(public readonly evaluationId: string) {}
}

/**
 * 하향평가 상세정보 조회 핸들러
 */
@Injectable()
@QueryHandler(GetDownwardEvaluationDetailQuery)
export class GetDownwardEvaluationDetailHandler
  implements IQueryHandler<GetDownwardEvaluationDetailQuery>
{
  private readonly logger = new Logger(GetDownwardEvaluationDetailHandler.name);

  constructor(
    private readonly downwardEvaluationService: DownwardEvaluationService,
  ) {}

  async execute(
    query: GetDownwardEvaluationDetailQuery,
  ): Promise<DownwardEvaluationDto> {
    const { evaluationId } = query;

    this.logger.log('하향평가 상세정보 조회 핸들러 실행', { evaluationId });

    // ?�향?��? ?�세?�보 조회
    const evaluation =
      await this.downwardEvaluationService.조회한다(evaluationId);

    if (!evaluation) {
      throw new Error('존재하지 않는 하향평가입니다.');
    }

    this.logger.log('하향평가 상세정보 조회 완료', { evaluationId });

    return evaluation.DTO로_변환한다();
  }
}



