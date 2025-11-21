import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { 평가활동내역을생성한다 } from '@context/evaluation-activity-log-context/handlers';
import { RecipientType } from '@domain/sub/evaluation-revision-request';
import type { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

/**
 * 평가기준 비즈니스 서비스
 *
 * 평가기준 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 평가기준 제출
 * - 재작성 요청 자동 완료 처리
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class EvaluationCriteriaBusinessService {
  private readonly logger = new Logger(EvaluationCriteriaBusinessService.name);

  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly revisionRequestContextService: RevisionRequestContextService,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * 평가기준을 제출하고 재작성 요청을 자동 완료 처리한다
   * 평가기준 제출 시 해당 제출자에게 전송된 재작성 요청이 존재하면 자동으로 완료 처리합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param submittedBy 제출자 ID
   */
  async 평가기준을_제출하고_재작성요청을_완료한다(
    evaluationPeriodId: string,
    employeeId: string,
    submittedBy: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    this.logger.log(
      `평가기준 제출 및 재작성 요청 완료 처리 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    // 1. 평가기준 제출
    const result =
      await this.evaluationCriteriaManagementService.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        submittedBy,
      );

    // 2. 해당 평가기간에 발생한 평가기준에 대한 재작성 요청 자동 완료 처리
    // 피평가자에게 요청된 재작성 요청 완료 처리
    // (criteria 단계의 경우 자동으로 1차평가자도 함께 완료 처리됨)
    try {
      await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'criteria',
        employeeId,
        RecipientType.EVALUATEE,
        '평가기준 제출로 인한 재작성 완료 처리',
      );

      this.logger.log(
        `재작성 요청 자동 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 재작성 요청이 없거나 이미 완료된 경우는 정상적인 상황일 수 있음
      this.logger.debug(
        `재작성 요청 자동 완료 처리 실패 (재작성 요청이 없거나 이미 완료되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
    }

    // 3. 활동 내역 기록
    try {
      await this.commandBus.execute(
        new 평가활동내역을생성한다(
          evaluationPeriodId,
          employeeId,
          'evaluation_criteria',
          'submitted',
          '평가기준 제출',
          undefined, // activityDescription
          'evaluation_criteria',
          undefined, // relatedEntityId
          submittedBy,
          undefined, // performedByName
          undefined, // activityMetadata
        ),
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 제출은 정상 처리
      this.logger.warn('평가기준 제출 활동 내역 기록 실패', {
        error: error.message,
      });
    }

    this.logger.log(
      `평가기준 제출 및 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    return result;
  }
}
