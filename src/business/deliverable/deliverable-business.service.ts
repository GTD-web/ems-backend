import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { 평가활동내역을생성한다 } from '@context/evaluation-activity-log-context/handlers';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableNotFoundException } from '@domain/core/deliverable/deliverable.exceptions';
import type { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import type { DeliverableType } from '@domain/core/deliverable/deliverable.types';

/**
 * 산출물 비즈니스 서비스
 *
 * 산출물 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 활동 내역 자동 기록
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class DeliverableBusinessService {
  private readonly logger = new Logger(DeliverableBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly commandBus: CommandBus,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly deliverableService: DeliverableService,
  ) {}

  /**
   * 산출물을 생성한다 (활동 내역 기록 포함)
   */
  async 산출물을_생성한다(data: {
    name: string;
    type: DeliverableType;
    employeeId: string;
    wbsItemId: string;
    description?: string;
    filePath?: string;
    createdBy: string;
  }): Promise<Deliverable> {
    this.logger.log('산출물 생성 시작', {
      employeeId: data.employeeId,
      wbsItemId: data.wbsItemId,
    });

    // 1. 산출물 생성
    const deliverable =
      await this.performanceEvaluationService.산출물을_생성한다(data);

    // 2. 활동 내역 기록
    try {
      const periodId = await this.평가기간을_조회한다(
        data.employeeId,
        data.wbsItemId,
      );
      if (periodId) {
        await this.commandBus.execute(
          new 평가활동내역을생성한다(
            periodId,
            data.employeeId,
            'deliverable',
            'created',
            '산출물 생성',
            undefined, // activityDescription
            'deliverable',
            deliverable.id,
            data.createdBy,
            undefined, // performedByName
            {
              deliverableName: data.name,
              deliverableType: data.type,
              wbsItemId: data.wbsItemId,
            },
          ),
        );
      }
    } catch (error) {
      // 활동 내역 기록 실패 시에도 산출물 생성은 정상 처리
      this.logger.warn('활동 내역 기록 실패', {
        employeeId: data.employeeId,
        wbsItemId: data.wbsItemId,
        error: error.message,
      });
    }

    this.logger.log('산출물 생성 완료', { id: deliverable.id });

    return deliverable;
  }

  /**
   * 산출물을 수정한다 (활동 내역 기록 포함)
   */
  async 산출물을_수정한다(data: {
    id: string;
    updatedBy: string;
    name?: string;
    type?: DeliverableType;
    description?: string;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    isActive?: boolean;
  }): Promise<Deliverable> {
    this.logger.log('산출물 수정 시작', { id: data.id });

    // 1. 기존 산출물 조회
    const existingDeliverable = await this.deliverableService.조회한다(data.id);
    if (!existingDeliverable) {
      throw new DeliverableNotFoundException(data.id);
    }

    // 2. 산출물 수정
    const deliverable =
      await this.performanceEvaluationService.산출물을_수정한다(data);

    // 3. 활동 내역 기록
    try {
      const employeeId = data.employeeId || existingDeliverable.employeeId;
      const wbsItemId = data.wbsItemId || existingDeliverable.wbsItemId;

      if (employeeId && wbsItemId) {
        const periodId = await this.평가기간을_조회한다(employeeId, wbsItemId);
        if (periodId) {
          await this.commandBus.execute(
            new 평가활동내역을생성한다(
              periodId,
              employeeId,
              'deliverable',
              'updated',
              '산출물 수정',
              undefined, // activityDescription
              'deliverable',
              deliverable.id,
              data.updatedBy,
              undefined, // performedByName
              {
                deliverableName: deliverable.name,
                deliverableType: deliverable.type,
                wbsItemId,
              },
            ),
          );
        }
      }
    } catch (error) {
      // 활동 내역 기록 실패 시에도 산출물 수정은 정상 처리
      this.logger.warn('활동 내역 기록 실패', {
        id: data.id,
        error: error.message,
      });
    }

    this.logger.log('산출물 수정 완료', { id: deliverable.id });

    return deliverable;
  }

  /**
   * 산출물을 삭제한다 (활동 내역 기록 포함)
   */
  async 산출물을_삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log('산출물 삭제 시작', { id });

    // 1. 기존 산출물 조회
    const existingDeliverable = await this.deliverableService.조회한다(id);
    if (!existingDeliverable) {
      throw new DeliverableNotFoundException(id);
    }

    // 2. 산출물 삭제
    await this.performanceEvaluationService.산출물을_삭제한다(id, deletedBy);

    // 3. 활동 내역 기록
    try {
      if (existingDeliverable.employeeId && existingDeliverable.wbsItemId) {
        const periodId = await this.평가기간을_조회한다(
          existingDeliverable.employeeId,
          existingDeliverable.wbsItemId,
        );
        if (periodId) {
          await this.commandBus.execute(
            new 평가활동내역을생성한다(
              periodId,
              existingDeliverable.employeeId,
              'deliverable',
              'deleted',
              '산출물 삭제',
              undefined, // activityDescription
              'deliverable',
              id,
              deletedBy,
              undefined, // performedByName
              {
                deliverableName: existingDeliverable.name,
                deliverableType: existingDeliverable.type,
                wbsItemId: existingDeliverable.wbsItemId,
              },
            ),
          );
        }
      }
    } catch (error) {
      // 활동 내역 기록 실패 시에도 산출물 삭제는 정상 처리
      this.logger.warn('활동 내역 기록 실패', {
        id,
        error: error.message,
      });
    }

    this.logger.log('산출물 삭제 완료', { id });
  }

  /**
   * 산출물을 벌크 생성한다 (활동 내역 기록 포함)
   */
  async 산출물을_벌크_생성한다(data: {
    deliverables: Array<{
      name: string;
      description?: string;
      type: DeliverableType;
      filePath?: string;
      employeeId: string;
      wbsItemId: string;
    }>;
    createdBy: string;
  }): Promise<{
    successCount: number;
    failedCount: number;
    createdIds: string[];
    failedItems: Array<{
      data: Partial<(typeof data.deliverables)[0]>;
      error: string;
    }>;
  }> {
    this.logger.log('산출물 벌크 생성 시작', {
      count: data.deliverables.length,
    });

    // 1. 산출물 벌크 생성
    const result =
      await this.performanceEvaluationService.산출물을_벌크_생성한다(data);

    // 2. 활동 내역 기록 (성공한 항목만)
    try {
      for (const deliverableData of data.deliverables) {
        if (result.createdIds.length > 0) {
          const periodId = await this.평가기간을_조회한다(
            deliverableData.employeeId,
            deliverableData.wbsItemId,
          );
          if (periodId) {
            await this.commandBus.execute(
              new 평가활동내역을생성한다(
                periodId,
                deliverableData.employeeId,
                'deliverable',
                'created',
                '산출물 생성',
                undefined, // activityDescription
                'deliverable',
                undefined, // relatedEntityId (벌크 생성 시 개별 ID 없음)
                data.createdBy,
                undefined, // performedByName
                {
                  deliverableName: deliverableData.name,
                  deliverableType: deliverableData.type,
                  wbsItemId: deliverableData.wbsItemId,
                  bulkOperation: true,
                },
              ),
            );
          }
        }
      }
    } catch (error) {
      // 활동 내역 기록 실패 시에도 산출물 생성은 정상 처리
      this.logger.warn('활동 내역 기록 실패', {
        error: error.message,
      });
    }

    this.logger.log('산출물 벌크 생성 완료', {
      successCount: result.successCount,
      failedCount: result.failedCount,
    });

    return result;
  }

  /**
   * 산출물을 벌크 삭제한다 (활동 내역 기록 포함)
   */
  async 산출물을_벌크_삭제한다(data: {
    ids: string[];
    deletedBy: string;
  }): Promise<{
    successCount: number;
    failedCount: number;
    failedIds: Array<{ id: string; error: string }>;
  }> {
    this.logger.log('산출물 벌크 삭제 시작', { count: data.ids.length });

    // 1. 기존 산출물 조회
    const deliverables = await Promise.all(
      data.ids.map((id) => this.deliverableService.조회한다(id)),
    );

    // 2. 산출물 벌크 삭제
    const result =
      await this.performanceEvaluationService.산출물을_벌크_삭제한다(data);

    // 3. 활동 내역 기록 (성공한 항목만)
    try {
      for (const deliverable of deliverables) {
        if (deliverable && deliverable.employeeId && deliverable.wbsItemId) {
          const periodId = await this.평가기간을_조회한다(
            deliverable.employeeId,
            deliverable.wbsItemId,
          );
          if (periodId) {
            await this.commandBus.execute(
              new 평가활동내역을생성한다(
                periodId,
                deliverable.employeeId,
                'deliverable',
                'deleted',
                '산출물 삭제',
                undefined, // activityDescription
                'deliverable',
                deliverable.id,
                data.deletedBy,
                undefined, // performedByName
                {
                  deliverableName: deliverable.name,
                  deliverableType: deliverable.type,
                  wbsItemId: deliverable.wbsItemId,
                  bulkOperation: true,
                },
              ),
            );
          }
        }
      }
    } catch (error) {
      // 활동 내역 기록 실패 시에도 산출물 삭제는 정상 처리
      this.logger.warn('활동 내역 기록 실패', {
        error: error.message,
      });
    }

    this.logger.log('산출물 벌크 삭제 완료', {
      successCount: result.successCount,
      failedCount: result.failedCount,
    });

    return result;
  }

  /**
   * 직원별 산출물을 조회한다
   */
  async 직원별_산출물을_조회한다(
    employeeId: string,
    activeOnly: boolean = true,
  ): Promise<Deliverable[]> {
    return await this.performanceEvaluationService.직원별_산출물을_조회한다(
      employeeId,
      activeOnly,
    );
  }

  /**
   * WBS 항목별 산출물을 조회한다
   */
  async WBS항목별_산출물을_조회한다(
    wbsItemId: string,
    activeOnly: boolean = true,
  ): Promise<Deliverable[]> {
    return await this.performanceEvaluationService.WBS항목별_산출물을_조회한다(
      wbsItemId,
      activeOnly,
    );
  }

  /**
   * 산출물 상세를 조회한다
   */
  async 산출물_상세를_조회한다(id: string): Promise<Deliverable> {
    return await this.performanceEvaluationService.산출물_상세를_조회한다(id);
  }

  /**
   * WBS 할당을 통해 평가기간을 조회한다
   */
  private async 평가기간을_조회한다(
    employeeId: string,
    wbsItemId: string,
  ): Promise<string | null> {
    try {
      // WBS 항목별 할당 조회
      const wbsAssignments =
        await this.evaluationWbsAssignmentService.WBS항목별_조회한다(wbsItemId);

      if (wbsAssignments && wbsAssignments.length > 0) {
        // 직원과 일치하는 할당 찾기
        const assignment = wbsAssignments.find(
          (a) => a.employeeId === employeeId,
        );

        if (assignment) {
          return assignment.periodId;
        }
      }

      return null;
    } catch (error) {
      this.logger.warn('평가기간 조회 실패', {
        employeeId,
        wbsItemId,
        error: error.message,
      });
      return null;
    }
  }
}
