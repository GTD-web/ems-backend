import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import type { PeerEvaluationDto } from '@domain/core/peer-evaluation/peer-evaluation.types';

/**
 * 동료평가 상세정보 조회 쿼리
 */
export class GetPeerEvaluationDetailQuery {
  constructor(public readonly evaluationId: string) {}
}

/**
 * 동료평가 상세정보 조회 핸들러
 */
@Injectable()
@QueryHandler(GetPeerEvaluationDetailQuery)
export class GetPeerEvaluationDetailHandler
  implements IQueryHandler<GetPeerEvaluationDetailQuery>
{
  private readonly logger = new Logger(GetPeerEvaluationDetailHandler.name);

  constructor(private readonly peerEvaluationService: PeerEvaluationService) {}

  async execute(
    query: GetPeerEvaluationDetailQuery,
  ): Promise<PeerEvaluationDto> {
    const { evaluationId } = query;

    this.logger.log('?�료?��? ?�세?�보 조회 ?�들???�행', { evaluationId });

    // ?�료?��? ?�세?�보 조회
    const evaluation = await this.peerEvaluationService.조회한다(evaluationId);

    if (!evaluation) {
      throw new Error('존재하지 않는 동료평가입니다.');
    }

    this.logger.log('동료평가 상세정보 조회 완료', { evaluationId });

    return evaluation.DTO로_변환한다();
  }
}




