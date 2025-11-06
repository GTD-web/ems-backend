import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import type { SubmitAllWbsSelfEvaluationsResponse } from '@context/performance-evaluation-context/handlers/self-evaluation';
import { RecipientType } from '@domain/sub/evaluation-revision-request';

/**
 * WBS 자기평가 비즈니스 서비스
 *
 * WBS 자기평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 재작성 요청 자동 완료 처리
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class WbsSelfEvaluationBusinessService {
  private readonly logger = new Logger(WbsSelfEvaluationBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly revisionRequestContextService: RevisionRequestContextService,
  ) {}

  /**
   * 직원의 전체 WBS 자기평가를 제출하고 재작성 요청을 자동 완료 처리한다 (1차 평가자 → 관리자)
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 관리자에게 제출하고,
   * 해당 평가기간에 발생한 자기평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   */
  async 직원의_전체_WBS자기평가를_제출하고_재작성요청을_완료한다(
    employeeId: string,
    periodId: string,
    submittedBy: string,
  ): Promise<SubmitAllWbsSelfEvaluationsResponse> {
    this.logger.log(
      `직원의 전체 WBS 자기평가 제출 및 재작성 요청 완료 처리 시작 - 직원: ${employeeId}, 평가기간: ${periodId}`,
    );

    // 1. 자기평가 제출
    const result =
      await this.performanceEvaluationService.직원의_전체_WBS자기평가를_제출한다(
        employeeId,
        periodId,
        submittedBy,
      );

    // 2. 해당 평가기간에 발생한 자기평가에 대한 재작성 요청 자동 완료 처리
    // 피평가자에게 요청된 재작성 요청 완료 처리
    // (criteria, self 단계의 경우 자동으로 1차평가자도 함께 완료 처리됨)
    await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
      periodId,
      employeeId,
      'self',
      employeeId,
      RecipientType.EVALUATEE,
      '자기평가 제출로 인한 재작성 완료 처리',
    );

    this.logger.log(
      `직원의 전체 WBS 자기평가 제출 및 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${periodId}`,
    );

    return result;
  }
}
