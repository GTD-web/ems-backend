import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { 평가활동내역을생성한다 } from '@context/evaluation-activity-log-context/handlers';

/**
 * 평가라인 구성 비즈니스 서비스
 *
 * 평가라인 구성 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 평가라인 구성
 * - 활동 내역 자동 기록
 */
@Injectable()
export class EvaluationLineBusinessService {
  private readonly logger = new Logger(EvaluationLineBusinessService.name);

  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * 1차 평가자를 구성한다 (활동 내역 기록 포함)
   */
  async 일차_평가자를_구성한다(
    employeeId: string,
    periodId: string,
    evaluatorId: string,
    createdBy: string,
  ): Promise<{
    message: string;
    createdLines: number;
    createdMappings: number;
    mapping: {
      id: string;
      employeeId: string;
      evaluatorId: string;
      wbsItemId: string | null;
      evaluationLineId: string;
    };
  }> {
    this.logger.log('1차 평가자 구성 시작', {
      employeeId,
      periodId,
      evaluatorId,
    });

    // 1차 평가자 구성
    const result =
      await this.evaluationCriteriaManagementService.일차_평가자를_구성한다(
        employeeId,
        periodId,
        evaluatorId,
        createdBy,
      );

    // 활동 내역 기록
    try {
      await this.commandBus.execute(
        new 평가활동내역을생성한다(
          periodId,
          employeeId,
          'evaluation_line',
          'updated',
          '1차 평가자 구성',
          undefined, // activityDescription
          'evaluation_line_mapping',
          result.mapping.id,
          createdBy,
          undefined, // performedByName
          {
            evaluatorId,
            evaluatorType: 'primary',
          },
        ),
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 평가라인 구성은 정상 처리
      this.logger.warn('1차 평가자 구성 활동 내역 기록 실패', {
        employeeId,
        periodId,
        evaluatorId,
        error: error.message,
      });
    }

    this.logger.log('1차 평가자 구성 완료', {
      employeeId,
      evaluatorId,
      mappingId: result.mapping.id,
    });

    return result;
  }

  /**
   * 2차 평가자를 구성한다 (활동 내역 기록 포함)
   */
  async 이차_평가자를_구성한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    evaluatorId: string,
    createdBy: string,
  ): Promise<{
    message: string;
    createdLines: number;
    createdMappings: number;
    mapping: {
      id: string;
      employeeId: string;
      evaluatorId: string;
      wbsItemId: string;
      evaluationLineId: string;
    };
  }> {
    this.logger.log('2차 평가자 구성 시작', {
      employeeId,
      wbsItemId,
      periodId,
      evaluatorId,
    });

    // 2차 평가자 구성
    const result =
      await this.evaluationCriteriaManagementService.이차_평가자를_구성한다(
        employeeId,
        wbsItemId,
        periodId,
        evaluatorId,
        createdBy,
      );

    // 활동 내역 기록
    try {
      await this.commandBus.execute(
        new 평가활동내역을생성한다(
          periodId,
          employeeId,
          'evaluation_line',
          'updated',
          '2차 평가자 구성',
          undefined, // activityDescription
          'evaluation_line_mapping',
          result.mapping.id,
          createdBy,
          undefined, // performedByName
          {
            evaluatorId,
            evaluatorType: 'secondary',
            wbsItemId,
          },
        ),
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 평가라인 구성은 정상 처리
      this.logger.warn('2차 평가자 구성 활동 내역 기록 실패', {
        employeeId,
        wbsItemId,
        periodId,
        evaluatorId,
        error: error.message,
      });
    }

    this.logger.log('2차 평가자 구성 완료', {
      employeeId,
      wbsItemId,
      evaluatorId,
      mappingId: result.mapping.id,
    });

    return result;
  }

  /**
   * 여러 피평가자의 1차 평가자를 일괄 구성한다 (활동 내역 기록 포함)
   */
  async 여러_피평가자의_일차_평가자를_일괄_구성한다(
    periodId: string,
    assignments: Array<{ employeeId: string; evaluatorId: string }>,
    createdBy: string,
  ): Promise<{
    periodId: string;
    totalCount: number;
    successCount: number;
    failureCount: number;
    createdLines: number;
    createdMappings: number;
    results: Array<{
      employeeId: string;
      evaluatorId: string;
      status: 'success' | 'error';
      message?: string;
      mapping?: {
        id: string;
        employeeId: string;
        evaluatorId: string;
        wbsItemId: string | null;
        evaluationLineId: string;
      };
      error?: string;
    }>;
  }> {
    this.logger.log('여러 피평가자의 1차 평가자 일괄 구성 시작', {
      periodId,
      count: assignments.length,
    });

    // 여러 피평가자의 1차 평가자 일괄 구성
    const result =
      await this.evaluationCriteriaManagementService.여러_피평가자의_일차_평가자를_일괄_구성한다(
        periodId,
        assignments,
        createdBy,
      );

    // 각 성공한 구성에 대해 활동 내역 기록
    await Promise.all(
      result.results
        .filter((r) => r.status === 'success' && r.mapping)
        .map(async (r) => {
          try {
            await this.commandBus.execute(
              new 평가활동내역을생성한다(
                periodId,
                r.employeeId,
                'evaluation_line',
                'updated',
                '1차 평가자 구성',
                undefined, // activityDescription
                'evaluation_line_mapping',
                r.mapping!.id,
                createdBy,
                undefined, // performedByName
                {
                  evaluatorId: r.evaluatorId,
                  evaluatorType: 'primary',
                },
              ),
            );
          } catch (error) {
            // 활동 내역 기록 실패 시에도 평가라인 구성은 정상 처리
            this.logger.warn('1차 평가자 일괄 구성 활동 내역 기록 실패', {
              employeeId: r.employeeId,
              periodId,
              evaluatorId: r.evaluatorId,
              error: error.message,
            });
          }
        }),
    );

    this.logger.log('여러 피평가자의 1차 평가자 일괄 구성 완료', {
      periodId,
      totalCount: result.totalCount,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });

    return result;
  }

  /**
   * 여러 피평가자의 2차 평가자를 일괄 구성한다 (활동 내역 기록 포함)
   */
  async 여러_피평가자의_이차_평가자를_일괄_구성한다(
    periodId: string,
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      evaluatorId: string;
    }>,
    createdBy: string,
  ): Promise<{
    periodId: string;
    totalCount: number;
    successCount: number;
    failureCount: number;
    createdLines: number;
    createdMappings: number;
    results: Array<{
      employeeId: string;
      wbsItemId: string;
      evaluatorId: string;
      status: 'success' | 'error';
      message?: string;
      mapping?: {
        id: string;
        employeeId: string;
        evaluatorId: string;
        wbsItemId: string;
        evaluationLineId: string;
      };
      error?: string;
    }>;
  }> {
    this.logger.log('여러 피평가자의 2차 평가자 일괄 구성 시작', {
      periodId,
      count: assignments.length,
    });

    // 여러 피평가자의 2차 평가자 일괄 구성
    const result =
      await this.evaluationCriteriaManagementService.여러_피평가자의_이차_평가자를_일괄_구성한다(
        periodId,
        assignments,
        createdBy,
      );

    // 각 성공한 구성에 대해 활동 내역 기록
    await Promise.all(
      result.results
        .filter((r) => r.status === 'success' && r.mapping)
        .map(async (r) => {
          try {
            await this.commandBus.execute(
              new 평가활동내역을생성한다(
                periodId,
                r.employeeId,
                'evaluation_line',
                'updated',
                '2차 평가자 구성',
                undefined, // activityDescription
                'evaluation_line_mapping',
                r.mapping!.id,
                createdBy,
                undefined, // performedByName
                {
                  evaluatorId: r.evaluatorId,
                  evaluatorType: 'secondary',
                  wbsItemId: r.wbsItemId,
                },
              ),
            );
          } catch (error) {
            // 활동 내역 기록 실패 시에도 평가라인 구성은 정상 처리
            this.logger.warn('2차 평가자 일괄 구성 활동 내역 기록 실패', {
              employeeId: r.employeeId,
              wbsItemId: r.wbsItemId,
              periodId,
              evaluatorId: r.evaluatorId,
              error: error.message,
            });
          }
        }),
    );

    this.logger.log('여러 피평가자의 2차 평가자 일괄 구성 완료', {
      periodId,
      totalCount: result.totalCount,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });

    return result;
  }
}

