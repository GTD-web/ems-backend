import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { EvaluationRevisionRequestService } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.service';
import type { SubmitAllWbsSelfEvaluationsResponse } from '@context/performance-evaluation-context/handlers/self-evaluation';

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
    private readonly revisionRequestService: EvaluationRevisionRequestService,
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
    const result = await this.performanceEvaluationService.직원의_전체_WBS자기평가를_제출한다(
      employeeId,
      periodId,
      submittedBy,
    );

    // 2. 해당 평가기간에 발생한 자기평가에 대한 재작성 요청 조회
    const revisionRequests = await this.revisionRequestService.필터로_조회한다({
      evaluationPeriodId: periodId,
      employeeId,
      step: 'self',
    });

    // 3. 재작성 요청이 존재하면 자동 완료 처리
    if (revisionRequests.length > 0) {
      this.logger.log(
        `자기평가 재작성 요청 발견 - 요청 수: ${revisionRequests.length}`,
      );

      for (const request of revisionRequests) {
        if (!request.recipients || request.recipients.length === 0) {
          continue;
        }

        // 피평가자에게 전송된 재작성 요청 찾기
        const evaluateeRecipient = request.recipients.find(
          (r) =>
            !r.deletedAt &&
            r.recipientId === employeeId &&
            r.recipientType === 'evaluatee' &&
            !r.isCompleted,
        );

        if (evaluateeRecipient) {
          try {
            // 재작성 완료 응답 제출 (피평가자)
            // 재작성완료_응답을_제출한다 메서드가 자동으로 같은 재작성 요청의 다른 수신자(1차평가자)도 함께 완료 처리함
            await this.revisionRequestContextService.재작성완료_응답을_제출한다(
              request.id,
              employeeId,
              '자기평가 제출로 인한 재작성 완료 처리',
            );

            this.logger.log(
              `자기평가 재작성 요청 완료 처리 성공 (피평가자 및 1차평가자 자동 완료) - 요청 ID: ${request.id}, 수신자 ID: ${employeeId}`,
            );
          } catch (error) {
            this.logger.error(
              `자기평가 재작성 요청 완료 처리 실패 (피평가자) - 요청 ID: ${request.id}, 수신자 ID: ${employeeId}`,
              error,
            );
            // 재작성 요청 완료 처리 실패는 로그만 남기고 계속 진행
          }
        } else {
          // 피평가자에게 전송된 재작성 요청이 없으면 1차평가자에게 전송된 재작성 요청 처리
          const primaryEvaluatorRecipient = request.recipients.find(
            (r) =>
              !r.deletedAt &&
              r.recipientType === 'primary_evaluator' &&
              !r.isCompleted,
          );

          if (primaryEvaluatorRecipient) {
            try {
              // 재작성 완료 응답 제출 (1차평가자)
              // 재작성완료_응답을_제출한다 메서드가 자동으로 같은 재작성 요청의 다른 수신자(피평가자)도 함께 완료 처리함
              await this.revisionRequestContextService.재작성완료_응답을_제출한다(
                request.id,
                primaryEvaluatorRecipient.recipientId,
                '자기평가 제출로 인한 재작성 완료 처리',
              );

              this.logger.log(
                `자기평가 재작성 요청 완료 처리 성공 (1차평가자 및 피평가자 자동 완료) - 요청 ID: ${request.id}, 수신자 ID: ${primaryEvaluatorRecipient.recipientId}`,
              );
            } catch (error) {
              this.logger.error(
                `자기평가 재작성 요청 완료 처리 실패 (1차평가자) - 요청 ID: ${request.id}, 수신자 ID: ${primaryEvaluatorRecipient.recipientId}`,
                error,
              );
              // 재작성 요청 완료 처리 실패는 로그만 남기고 계속 진행
            }
          }
        }
      }
    }

    this.logger.log(
      `직원의 전체 WBS 자기평가 제출 및 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${periodId}`,
    );

    return result;
  }
}

