import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EvaluationPeriod } from './evaluation-period.entity';
import { EvaluationPeriodPhase, EvaluationPeriodStatus } from './evaluation-period.types';
import { EvaluationPeriodService } from './evaluation-period.service';

/**
 * 평가기간 자동 단계 변경 서비스
 * 
 * 평가기간의 단계별 마감일을 기반으로 자동으로 단계를 변경합니다.
 */
@Injectable()
export class EvaluationPeriodAutoPhaseService {
  private readonly logger = new Logger(EvaluationPeriodAutoPhaseService.name);

  constructor(
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  /**
   * 매 시간마다 실행되는 자동 단계 변경 스케줄러
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoPhaseTransition(): Promise<void> {
    this.logger.log('평가기간 자동 단계 변경을 시작합니다...');
    
    try {
      const now = new Date();
      
      // 현재 진행 중인 평가기간들을 조회
      const activePeriods = await this.evaluationPeriodRepository.find({
        where: {
          status: EvaluationPeriodStatus.IN_PROGRESS,
        },
      });

      this.logger.log(`진행 중인 평가기간 수: ${activePeriods.length}개`);

      for (const period of activePeriods) {
        await this.checkAndTransitionPhase(period, now);
      }

      this.logger.log('평가기간 자동 단계 변경이 완료되었습니다.');
    } catch (error) {
      this.logger.error('평가기간 자동 단계 변경 중 오류 발생:', error);
    }
  }

  /**
   * 특정 평가기간의 단계 전이를 확인하고 실행합니다.
   * 
   * @param period 평가기간 엔티티
   * @param now 현재 시간
   */
  private async checkAndTransitionPhase(period: EvaluationPeriod, now: Date): Promise<void> {
    const currentPhase = period.currentPhase;
    
    if (!currentPhase) {
      this.logger.warn(`평가기간 ${period.id}의 현재 단계가 설정되지 않았습니다.`);
      return;
    }

    // 다음 단계로 전이해야 하는지 확인
    const nextPhase = this.getNextPhase(currentPhase);
    if (!nextPhase) {
      this.logger.debug(`평가기간 ${period.id}는 더 이상 전이할 단계가 없습니다. (현재: ${currentPhase})`);
      return;
    }

    // 다음 단계의 마감일이 지났는지 확인
    const shouldTransition = this.shouldTransitionToNextPhase(period, nextPhase, now);
    
    if (shouldTransition) {
      try {
        this.logger.log(
          `평가기간 ${period.id} 단계 변경: ${currentPhase} → ${nextPhase}`
        );
        
        await this.evaluationPeriodService.단계_변경한다(
          period.id,
          nextPhase,
          'SYSTEM_AUTO_PHASE', // 시스템 자동 변경
        );
        
        this.logger.log(
          `평가기간 ${period.id} 단계 변경 완료: ${currentPhase} → ${nextPhase}`
        );
      } catch (error) {
        this.logger.error(
          `평가기간 ${period.id} 단계 변경 실패: ${error.message}`,
          error.stack
        );
      }
    }
  }

  /**
   * 현재 단계에서 다음 단계를 반환합니다.
   * 
   * @param currentPhase 현재 단계
   * @returns 다음 단계 또는 null (더 이상 전이할 단계가 없는 경우)
   */
  private getNextPhase(currentPhase: EvaluationPeriodPhase): EvaluationPeriodPhase | null {
    const phaseSequence: Record<EvaluationPeriodPhase, EvaluationPeriodPhase | null> = {
      [EvaluationPeriodPhase.WAITING]: EvaluationPeriodPhase.EVALUATION_SETUP,
      [EvaluationPeriodPhase.EVALUATION_SETUP]: EvaluationPeriodPhase.PERFORMANCE,
      [EvaluationPeriodPhase.PERFORMANCE]: EvaluationPeriodPhase.SELF_EVALUATION,
      [EvaluationPeriodPhase.SELF_EVALUATION]: EvaluationPeriodPhase.PEER_EVALUATION,
      [EvaluationPeriodPhase.PEER_EVALUATION]: EvaluationPeriodPhase.CLOSURE,
      [EvaluationPeriodPhase.CLOSURE]: null, // 종결 단계는 더 이상 전이하지 않음
    };

    return phaseSequence[currentPhase] || null;
  }

  /**
   * 다음 단계로 전이해야 하는지 확인합니다.
   * 
   * @param period 평가기간 엔티티
   * @param nextPhase 다음 단계
   * @param now 현재 시간
   * @returns 전이 여부
   */
  private shouldTransitionToNextPhase(
    period: EvaluationPeriod,
    nextPhase: EvaluationPeriodPhase,
    now: Date,
  ): boolean {
    // 다음 단계의 마감일을 확인
    const nextPhaseDeadline = this.getPhaseDeadline(period, nextPhase);
    
    if (!nextPhaseDeadline) {
      // 마감일이 설정되지 않은 경우, 전이하지 않음
      this.logger.debug(
        `평가기간 ${period.id}의 ${nextPhase} 단계 마감일이 설정되지 않았습니다.`
      );
      return false;
    }

    // 현재 시간이 마감일을 지났는지 확인
    const shouldTransition = now >= nextPhaseDeadline;
    
    if (shouldTransition) {
      this.logger.debug(
        `평가기간 ${period.id}: ${nextPhase} 단계 마감일 도달 (마감일: ${nextPhaseDeadline.toISOString()}, 현재: ${now.toISOString()})`
      );
    }

    return shouldTransition;
  }

  /**
   * 특정 단계의 마감일을 반환합니다.
   * 
   * @param period 평가기간 엔티티
   * @param phase 단계
   * @returns 마감일 또는 null
   */
  private getPhaseDeadline(period: EvaluationPeriod, phase: EvaluationPeriodPhase): Date | null {
    switch (phase) {
      case EvaluationPeriodPhase.EVALUATION_SETUP:
        return period.evaluationSetupDeadline || null;
      case EvaluationPeriodPhase.PERFORMANCE:
        return period.performanceDeadline || null;
      case EvaluationPeriodPhase.SELF_EVALUATION:
        return period.selfEvaluationDeadline || null;
      case EvaluationPeriodPhase.PEER_EVALUATION:
        return period.peerEvaluationDeadline || null;
      case EvaluationPeriodPhase.CLOSURE:
        return period.peerEvaluationDeadline || null; // 종결은 동료평가 마감일과 동일
      default:
        return null;
    }
  }

  /**
   * 수동으로 단계 전이를 실행합니다.
   * 
   * @param periodId 평가기간 ID
   * @returns 전이된 평가기간 정보
   */
  async manualPhaseTransition(periodId: string): Promise<EvaluationPeriod | null> {
    this.logger.log(`평가기간 ${periodId} 수동 단계 전이를 시작합니다...`);
    
    try {
      const period = await this.evaluationPeriodRepository.findOne({
        where: { id: periodId },
      });

      if (!period) {
        this.logger.warn(`평가기간 ${periodId}를 찾을 수 없습니다.`);
        return null;
      }

      if (period.status !== EvaluationPeriodStatus.IN_PROGRESS) {
        this.logger.warn(`평가기간 ${periodId}가 진행 중 상태가 아닙니다. (현재 상태: ${period.status})`);
        return null;
      }

      await this.checkAndTransitionPhase(period, new Date());
      
      // 업데이트된 평가기간 정보 반환
      return await this.evaluationPeriodRepository.findOne({
        where: { id: periodId },
      });
    } catch (error) {
      this.logger.error(`평가기간 ${periodId} 수동 단계 전이 실패:`, error);
      throw error;
    }
  }

  /**
   * 모든 진행 중인 평가기간의 단계 전이를 확인합니다.
   * 
   * @returns 전이된 평가기간 수
   */
  async checkAllActivePeriods(): Promise<number> {
    this.logger.log('모든 진행 중인 평가기간의 단계 전이를 확인합니다...');
    
    const now = new Date();
    const activePeriods = await this.evaluationPeriodRepository.find({
      where: {
        status: EvaluationPeriodStatus.IN_PROGRESS,
      },
    });

    let transitionedCount = 0;

    for (const period of activePeriods) {
      const beforePhase = period.currentPhase;
      await this.checkAndTransitionPhase(period, now);
      
      // 실제로 전이되었는지 확인
      const updatedPeriod = await this.evaluationPeriodRepository.findOne({
        where: { id: period.id },
      });
      
      if (updatedPeriod && updatedPeriod.currentPhase !== beforePhase) {
        transitionedCount++;
      }
    }

    this.logger.log(`총 ${transitionedCount}개의 평가기간이 단계 전이되었습니다.`);
    return transitionedCount;
  }
}
