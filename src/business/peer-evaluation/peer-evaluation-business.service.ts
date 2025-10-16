import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import {
  CreatePeerEvaluationCommand,
  UpdatePeerEvaluationCommand,
  UpsertPeerEvaluationCommand,
  SubmitPeerEvaluationCommand,
  GetPeerEvaluationListQuery,
  GetPeerEvaluationDetailQuery,
  PeerEvaluationDetailResult,
} from '@context/performance-evaluation-context/handlers/peer-evaluation';

/**
 * 동료평가 비즈니스 서비스
 *
 * 동료평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 알림 서비스 연동
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class PeerEvaluationBusinessService {
  private readonly logger = new Logger(PeerEvaluationBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    // private readonly notificationService: NotificationService, // TODO: 알림 서비스 추가 시 주입
  ) {}

  /**
   * 동료평가를 생성하고 알림을 발송한다
   */
  async 동료평가를_생성한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    projectId: string;
    peerEvaluationContent?: string;
    peerEvaluationScore?: number;
    createdBy: string;
  }): Promise<string> {
    this.logger.log('동료평가 생성 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      evaluateeId: params.evaluateeId,
    });

    // 1. 동료평가 생성 (컨텍스트 호출)
    const command = new CreatePeerEvaluationCommand(
      params.evaluatorId,
      params.evaluateeId,
      params.periodId,
      params.projectId,
      params.peerEvaluationContent,
      params.peerEvaluationScore,
      params.createdBy,
    );

    const evaluationId =
      await this.performanceEvaluationService.동료평가를_생성한다(command);

    // 2. 알림 발송 (추후 구현)
    // TODO: 동료평가 생성 알림 발송
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATION_CREATED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     evaluationId,
    //     evaluatorId: params.evaluatorId,
    //   },
    // });

    this.logger.log('동료평가 생성 및 알림 발송 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 동료평가를 수정한다
   */
  async 동료평가를_수정한다(params: {
    evaluationId: string;
    peerEvaluationContent?: string;
    peerEvaluationScore?: number;
    updatedBy: string;
  }): Promise<void> {
    this.logger.log('동료평가 수정 비즈니스 로직 시작', {
      evaluationId: params.evaluationId,
    });

    const command = new UpdatePeerEvaluationCommand(
      params.evaluationId,
      params.peerEvaluationContent,
      params.peerEvaluationScore,
      params.updatedBy,
    );

    await this.performanceEvaluationService.동료평가를_수정한다(command);

    this.logger.log('동료평가 수정 완료', {
      evaluationId: params.evaluationId,
    });
  }

  /**
   * 동료평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  async 동료평가를_저장한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    projectId: string;
    peerEvaluationContent?: string;
    peerEvaluationScore?: number;
    actionBy: string;
  }): Promise<string> {
    this.logger.log('동료평가 저장 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      evaluateeId: params.evaluateeId,
    });

    // 1. 동료평가 저장 (컨텍스트 호출 - upsert)
    const command = new UpsertPeerEvaluationCommand(
      params.evaluatorId,
      params.evaluateeId,
      params.periodId,
      params.projectId,
      params.peerEvaluationContent,
      params.peerEvaluationScore,
      params.actionBy,
    );

    const evaluationId =
      await this.performanceEvaluationService.동료평가를_저장한다(command);

    // 2. 알림 발송 (추후 구현)
    // TODO: 동료평가 저장 알림 발송
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATION_SAVED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     evaluationId,
    //     evaluatorId: params.evaluatorId,
    //   },
    // });

    this.logger.log('동료평가 저장 및 알림 발송 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 동료평가를 취소한다
   */
  async 동료평가를_취소한다(params: {
    evaluationId: string;
    cancelledBy: string;
  }): Promise<void> {
    this.logger.log('동료평가 취소 비즈니스 로직 시작', {
      evaluationId: params.evaluationId,
    });

    // 1. 동료평가 취소 (컨텍스트 호출)
    await this.performanceEvaluationService.동료평가를_취소한다(
      params.evaluationId,
      params.cancelledBy,
    );

    // 2. 알림 발송 (추후 구현)
    // TODO: 동료평가 취소 알림 발송
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATION_CANCELLED',
    //   recipientId: evaluateeId,
    //   data: {
    //     evaluationId: params.evaluationId,
    //   },
    // });

    this.logger.log('동료평가 취소 완료', {
      evaluationId: params.evaluationId,
    });
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가를 취소한다
   */
  async 피평가자의_동료평가를_일괄_취소한다(params: {
    evaluateeId: string;
    periodId: string;
    cancelledBy: string;
  }): Promise<{ cancelledCount: number }> {
    this.logger.log('피평가자의 동료평가 일괄 취소 비즈니스 로직 시작', {
      evaluateeId: params.evaluateeId,
      periodId: params.periodId,
    });

    // 1. 동료평가 일괄 취소 (컨텍스트 호출)
    const result =
      await this.performanceEvaluationService.피평가자의_동료평가를_일괄_취소한다(
        params.evaluateeId,
        params.periodId,
        params.cancelledBy,
      );

    // 2. 알림 발송 (추후 구현)
    // TODO: 동료평가 일괄 취소 알림 발송
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATIONS_CANCELLED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     periodId: params.periodId,
    //     cancelledCount: result.cancelledCount,
    //   },
    // });

    this.logger.log('피평가자의 동료평가 일괄 취소 완료', {
      cancelledCount: result.cancelledCount,
    });

    return result;
  }

  /**
   * 동료평가를 제출하고 알림을 발송한다
   */
  async 동료평가를_제출한다(params: {
    evaluationId: string;
    submittedBy: string;
  }): Promise<void> {
    this.logger.log('동료평가 제출 비즈니스 로직 시작', {
      evaluationId: params.evaluationId,
    });

    // 1. 동료평가 제출 (컨텍스트 호출)
    const command = new SubmitPeerEvaluationCommand(
      params.evaluationId,
      params.submittedBy,
    );

    await this.performanceEvaluationService.동료평가를_제출한다(command);

    // 2. 알림 발송 (추후 구현)
    // TODO: 동료평가 제출 알림 발송
    // const evaluation = await this.performanceEvaluationService.동료평가_상세정보를_조회한다({
    //   evaluationId: params.evaluationId,
    // });
    //
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATION_SUBMITTED',
    //   recipientId: evaluation.evaluateeId,
    //   data: {
    //     evaluationId: params.evaluationId,
    //     evaluatorId: evaluation.evaluatorId,
    //   },
    // });

    this.logger.log('동료평가 제출 및 알림 발송 완료', {
      evaluationId: params.evaluationId,
    });
  }

  /**
   * 동료평가 목록을 조회한다
   */
  async 동료평가_목록을_조회한다(params: {
    evaluatorId?: string;
    evaluateeId?: string;
    periodId?: string;
    projectId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    this.logger.log('동료평가 목록 조회 비즈니스 로직', {
      evaluatorId: params.evaluatorId,
    });

    const query = new GetPeerEvaluationListQuery(
      params.evaluatorId,
      params.evaluateeId,
      params.periodId,
      params.projectId,
      params.status,
      params.page,
      params.limit,
    );

    return await this.performanceEvaluationService.동료평가_목록을_조회한다(
      query,
    );
  }

  /**
   * 동료평가 상세정보를 조회한다
   */
  async 동료평가_상세정보를_조회한다(params: {
    evaluationId: string;
  }): Promise<PeerEvaluationDetailResult> {
    this.logger.log('동료평가 상세정보 조회 비즈니스 로직', {
      evaluationId: params.evaluationId,
    });

    const query = new GetPeerEvaluationDetailQuery(params.evaluationId);

    return await this.performanceEvaluationService.동료평가_상세정보를_조회한다(
      query,
    );
  }
}
