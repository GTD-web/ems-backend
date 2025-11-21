import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { 재작성완료활동내역을생성한다 } from '@context/evaluation-activity-log-context/handlers';
import type { RevisionRequestStepType } from '@domain/sub/evaluation-revision-request';

/**
 * 재작성 요청 비즈니스 서비스
 *
 * 재작성 요청 처리 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 재작성 완료 응답 제출
 * - 활동 내역 기록
 */
@Injectable()
export class RevisionRequestBusinessService {
  private readonly logger = new Logger(RevisionRequestBusinessService.name);

  constructor(
    private readonly revisionRequestContextService: RevisionRequestContextService,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * 재작성 완료 응답을 제출한다 (활동 내역 기록 포함)
   */
  async 재작성완료_응답을_제출한다(
    requestId: string,
    recipientId: string,
    responseComment: string,
  ): Promise<void> {
    this.logger.log(
      `재작성 완료 응답 제출 시작 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );

    // 1. 재작성 완료 응답 제출 (컨텍스트 서비스 호출)
    // 컨텍스트 서비스에서 재작성 완료 처리 및 단계 승인 상태 변경을 수행
    // 하지만 활동 내역 기록은 제거됨
    const request =
      await this.revisionRequestContextService.재작성완료_응답을_제출한다_내부(
        requestId,
        recipientId,
        responseComment,
      );

    // 2. 활동 내역 기록
    try {
      // 모든 수신자가 완료했는지 확인
      let allCompleted: boolean;
      if (request.step === 'secondary') {
        allCompleted =
          await this.revisionRequestContextService.모든_2차평가자의_재작성요청이_완료했는가_내부(
            request.evaluationPeriodId,
            request.employeeId,
          );
      } else {
        allCompleted =
          await this.revisionRequestContextService.모든_수신자가_완료했는가_내부(
            requestId,
          );
      }

      await this.commandBus.execute(
        new 재작성완료활동내역을생성한다(
          request.evaluationPeriodId,
          request.employeeId,
          request.step,
          requestId,
          recipientId,
          responseComment,
          allCompleted,
        ),
      );

      this.logger.log('재작성 완료 활동 내역 기록 완료');
    } catch (error) {
      // 활동 내역 기록 실패 시에도 재작성 완료는 정상 처리
      this.logger.warn('재작성 완료 활동 내역 기록 실패', {
        requestId,
        recipientId,
        error: error.message,
      });
    }

    this.logger.log(
      `재작성 완료 응답 제출 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );
  }

  /**
   * 평가기간, 직원, 평가자 기반으로 재작성 완료 응답을 제출한다 (활동 내역 기록 포함)
   */
  async 평가기간_직원_평가자로_재작성완료_응답을_제출한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    step: RevisionRequestStepType,
    responseComment: string,
  ): Promise<void> {
    this.logger.log(
      `재작성 완료 응답 제출 시작 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}, 단계: ${step}`,
    );

    // 1. 재작성 완료 응답 제출 (컨텍스트 서비스 호출)
    const request =
      await this.revisionRequestContextService.평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부(
        evaluationPeriodId,
        employeeId,
        evaluatorId,
        step,
        responseComment,
      );

    // 2. 활동 내역 기록
    try {
      // 모든 수신자가 완료했는지 확인
      let allCompleted: boolean;
      if (request.step === 'secondary') {
        allCompleted =
          await this.revisionRequestContextService.모든_2차평가자의_재작성요청이_완료했는가_내부(
            request.evaluationPeriodId,
            request.employeeId,
          );
      } else {
        allCompleted =
          await this.revisionRequestContextService.모든_수신자가_완료했는가_내부(
            request.id,
          );
      }

      await this.commandBus.execute(
        new 재작성완료활동내역을생성한다(
          request.evaluationPeriodId,
          request.employeeId,
          request.step,
          request.id,
          evaluatorId,
          responseComment,
          allCompleted,
        ),
      );

      this.logger.log('재작성 완료 활동 내역 기록 완료');
    } catch (error) {
      // 활동 내역 기록 실패 시에도 재작성 완료는 정상 처리
      this.logger.warn('재작성 완료 활동 내역 기록 실패', {
        evaluationPeriodId,
        employeeId,
        evaluatorId,
        error: error.message,
      });
    }

    this.logger.log(
      `재작성 완료 응답 제출 완료 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}`,
    );
  }
}
