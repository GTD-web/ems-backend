import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';

/**
 * 하향평가 비즈니스 서비스
 *
 * 하향평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 평가라인 검증
 * - 평가자 권한 확인
 * - 여러 컨텍스트 간 조율
 * - 알림 서비스 연동 (추후)
 */
@Injectable()
export class DownwardEvaluationBusinessService {
  private readonly logger = new Logger(DownwardEvaluationBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    // private readonly notificationService: NotificationService, // TODO: 알림 서비스 추가 시 주입
  ) {}

  /**
   * 1차 하향평가를 저장한다 (평가라인 검증 포함)
   */
  async 일차_하향평가를_저장한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    actionBy: string;
  }): Promise<string> {
    this.logger.log('1차 하향평가 저장 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      evaluateeId: params.evaluateeId,
      wbsId: params.wbsId,
    });

    // 1. 평가라인 검증: 1차 평가자 권한 확인
    await this.평가라인을_검증한다(
      params.evaluateeId,
      params.evaluatorId,
      params.wbsId,
      'primary',
    );

    // 2. 하향평가 저장 (컨텍스트 호출)
    const evaluationId =
      await this.performanceEvaluationService.하향평가를_저장한다(
        params.evaluatorId,
        params.evaluateeId,
        params.periodId,
        params.wbsId,
        params.selfEvaluationId,
        'primary',
        params.downwardEvaluationContent,
        params.downwardEvaluationScore,
        params.actionBy,
      );

    // 3. 알림 발송 (추후 구현)
    // TODO: 1차 하향평가 저장 알림 발송
    // await this.notificationService.send({
    //   type: 'PRIMARY_DOWNWARD_EVALUATION_SAVED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     evaluationId,
    //     evaluatorId: params.evaluatorId,
    //     wbsId: params.wbsId,
    //   },
    // });

    this.logger.log('1차 하향평가 저장 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 2차 하향평가를 저장한다 (평가라인 검증 포함)
   */
  async 이차_하향평가를_저장한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    actionBy: string;
  }): Promise<string> {
    this.logger.log('2차 하향평가 저장 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      evaluateeId: params.evaluateeId,
      wbsId: params.wbsId,
    });

    // 1. 평가라인 검증: 2차 평가자 권한 확인
    await this.평가라인을_검증한다(
      params.evaluateeId,
      params.evaluatorId,
      params.wbsId,
      'secondary',
    );

    // 2. 하향평가 저장 (컨텍스트 호출)
    const evaluationId =
      await this.performanceEvaluationService.하향평가를_저장한다(
        params.evaluatorId,
        params.evaluateeId,
        params.periodId,
        params.wbsId,
        params.selfEvaluationId,
        'secondary',
        params.downwardEvaluationContent,
        params.downwardEvaluationScore,
        params.actionBy,
      );

    // 3. 알림 발송 (추후 구현)
    // TODO: 2차 하향평가 저장 알림 발송
    // await this.notificationService.send({
    //   type: 'SECONDARY_DOWNWARD_EVALUATION_SAVED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     evaluationId,
    //     evaluatorId: params.evaluatorId,
    //     wbsId: params.wbsId,
    //   },
    // });

    this.logger.log('2차 하향평가 저장 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 평가라인을 검증한다
   * - 평가자가 해당 피평가자의 해당 WBS에 대해 평가 권한이 있는지 확인
   * - 평가 유형(1차/2차)이 올바른지 확인
   */
  private async 평가라인을_검증한다(
    evaluateeId: string,
    evaluatorId: string,
    wbsId: string,
    evaluationType: 'primary' | 'secondary',
  ): Promise<void> {
    this.logger.debug('평가라인 검증 시작', {
      evaluateeId,
      evaluatorId,
      wbsId,
      evaluationType,
    });

    // 1. 평가라인 매핑 조회
    const mapping = await this.evaluationLineMappingRepository.findOne({
      where: {
        employeeId: evaluateeId,
        evaluatorId: evaluatorId,
        wbsItemId: wbsId,
        deletedAt: IsNull(),
      },
    });

    if (!mapping) {
      this.logger.warn('평가라인 매핑을 찾을 수 없습니다', {
        evaluateeId,
        evaluatorId,
        wbsId,
      });
      throw new ForbiddenException(
        `해당 평가자는 이 WBS 항목에 대한 평가 권한이 없습니다. (피평가자: ${evaluateeId}, 평가자: ${evaluatorId}, WBS: ${wbsId})`,
      );
    }

    // 2. 평가라인 조회하여 평가 유형 확인
    const evaluationLine = await this.evaluationLineRepository.findOne({
      where: {
        id: mapping.evaluationLineId,
        deletedAt: IsNull(),
      },
    });

    if (!evaluationLine) {
      this.logger.error('평가라인을 찾을 수 없습니다', {
        evaluationLineId: mapping.evaluationLineId,
      });
      throw new ForbiddenException(
        `평가라인 정보를 찾을 수 없습니다. (평가라인 ID: ${mapping.evaluationLineId})`,
      );
    }

    // 3. 평가 유형 검증
    const expectedEvaluatorType =
      evaluationType === 'primary'
        ? EvaluatorType.PRIMARY
        : EvaluatorType.SECONDARY;

    if (evaluationLine.evaluatorType !== expectedEvaluatorType) {
      const currentTypeLabel =
        evaluationLine.evaluatorType === EvaluatorType.PRIMARY
          ? '1차'
          : '2차';
      const expectedTypeLabel = evaluationType === 'primary' ? '1차' : '2차';

      this.logger.warn('평가 유형이 일치하지 않습니다', {
        evaluatorId,
        evaluateeId,
        wbsId,
        currentType: currentTypeLabel,
        expectedType: expectedTypeLabel,
      });

      throw new ForbiddenException(
        `해당 평가자는 ${expectedTypeLabel} 평가자로 지정되지 않았습니다. (현재: ${currentTypeLabel} 평가자)`,
      );
    }

    this.logger.debug('평가라인 검증 완료', {
      evaluateeId,
      evaluatorId,
      wbsId,
      evaluationType,
    });
  }
}

