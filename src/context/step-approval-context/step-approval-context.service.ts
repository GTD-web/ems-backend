import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmployeeEvaluationStepApprovalService,
  StepApprovalStatus,
} from '@domain/sub/employee-evaluation-step-approval';
import {
  EvaluationRevisionRequestService,
  RevisionRequestStepType,
  RecipientType,
} from '@domain/sub/evaluation-revision-request';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import type {
  IStepApprovalContext,
  UpdateStepApprovalRequest,
  UpdateStepApprovalByStepRequest,
  UpdateSecondaryStepApprovalRequest,
} from './interfaces/step-approval-context.interface';

/**
 * 단계 승인 컨텍스트 서비스
 * 평가 단계별 확인 상태 변경 및 재작성 요청 생성을 담당합니다.
 */
@Injectable()
export class StepApprovalContextService implements IStepApprovalContext {
  private readonly logger = new Logger(StepApprovalContextService.name);

  constructor(
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
    private readonly revisionRequestService: EvaluationRevisionRequestService,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  ) {}

  /**
   * 단계별 확인 상태를 변경한다
   */
  async 단계별_확인상태를_변경한다(
    request: UpdateStepApprovalRequest,
  ): Promise<void> {
    this.logger.log(
      `단계별 확인 상태 변경 시작 - 평가기간: ${request.evaluationPeriodId}, 직원: ${request.employeeId}, 단계: ${request.step}, 상태: ${request.status}`,
    );

    // 1. 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId: request.evaluationPeriodId,
        employeeId: request.employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `평가기간-직원 맵핑을 찾을 수 없습니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId})`,
      );
    }

    // 2. 단계 승인 정보 조회 또는 생성
    let stepApproval =
      await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);

    if (!stepApproval) {
      this.logger.log(
        `단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}`,
      );
      stepApproval = await this.stepApprovalService.생성한다({
        evaluationPeriodEmployeeMappingId: mapping.id,
        createdBy: request.updatedBy,
      });
    }

    // 3. 단계 상태 변경
    this.stepApprovalService.단계_상태를_변경한다(
      stepApproval,
      request.step,
      request.status,
      request.updatedBy,
    );

    // 4. 저장
    await this.stepApprovalService.저장한다(stepApproval);

    // 5. revision_requested인 경우 재작성 요청 생성
    if (request.status === StepApprovalStatus.REVISION_REQUESTED) {
      if (!request.revisionComment || request.revisionComment.trim() === '') {
        throw new NotFoundException('재작성 요청 코멘트는 필수입니다.');
      }

      await this.재작성요청을_생성한다(
        request.evaluationPeriodId,
        request.employeeId,
        request.step,
        request.revisionComment,
        request.updatedBy,
      );
    }

    this.logger.log(
      `단계별 확인 상태 변경 완료 - 직원: ${request.employeeId}, 단계: ${request.step}`,
    );
  }

  /**
   * 재작성 요청을 생성한다 (private)
   */
  private async 재작성요청을_생성한다(
    evaluationPeriodId: string,
    employeeId: string,
    step: RevisionRequestStepType,
    comment: string,
    requestedBy: string,
  ): Promise<void> {
    this.logger.log(
      `재작성 요청 생성 시작 - 직원: ${employeeId}, 단계: ${step}`,
    );

    // 수신자 목록 결정
    const recipients = await this.재작성요청_수신자를_조회한다(
      evaluationPeriodId,
      employeeId,
      step,
    );

    if (recipients.length === 0) {
      throw new NotFoundException(
        `재작성 요청 수신자를 찾을 수 없습니다. 평가라인 설정을 확인해주세요. (직원 ID: ${employeeId}, 단계: ${step})`,
      );
    }

    // 재작성 요청 생성
    await this.revisionRequestService.생성한다({
      evaluationPeriodId,
      employeeId,
      step,
      comment,
      requestedBy,
      recipients,
      createdBy: requestedBy,
    });

    this.logger.log(
      `재작성 요청 생성 완료 - 직원: ${employeeId}, 단계: ${step}, 수신자 수: ${recipients.length}`,
    );
  }

  /**
   * 재작성 요청 수신자를 조회한다
   *
   * 단계별 수신자 규칙:
   * - criteria (평가기준): 피평가자 + 1차평가자
   * - self (자기평가): 피평가자 + 1차평가자
   * - primary (1차평가): 1차평가자만
   * - secondary (2차평가): 2차평가자들만
   */
  private async 재작성요청_수신자를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    step: RevisionRequestStepType,
  ): Promise<Array<{ recipientId: string; recipientType: RecipientType }>> {
    const recipients: Array<{
      recipientId: string;
      recipientType: RecipientType;
    }> = [];

    switch (step) {
      case 'criteria':
      case 'self':
        // 피평가자 추가
        recipients.push({
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
        });

        // 1차평가자 추가
        const primaryEvaluator = await this.일차평가자를_조회한다(
          evaluationPeriodId,
          employeeId,
        );
        if (primaryEvaluator) {
          recipients.push({
            recipientId: primaryEvaluator,
            recipientType: RecipientType.PRIMARY_EVALUATOR,
          });
        }
        break;

      case 'primary':
        // 1차평가자만 추가
        const primaryOnly = await this.일차평가자를_조회한다(
          evaluationPeriodId,
          employeeId,
        );
        if (primaryOnly) {
          recipients.push({
            recipientId: primaryOnly,
            recipientType: RecipientType.PRIMARY_EVALUATOR,
          });
        }
        break;

      case 'secondary':
        // 2차평가자들 추가
        const secondaryEvaluators = await this.이차평가자들을_조회한다(
          evaluationPeriodId,
          employeeId,
        );
        secondaryEvaluators.forEach((evaluatorId) => {
          recipients.push({
            recipientId: evaluatorId,
            recipientType: RecipientType.SECONDARY_EVALUATOR,
          });
        });
        break;
    }

    return recipients;
  }

  /**
   * 1차평가자를 조회한다
   */
  private async 일차평가자를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<string | null> {
    // EvaluationLineMapping을 사용하여 평가자 조회
    // 먼저 평가기간-직원 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      return null;
    }

    // PRIMARY 타입의 평가라인을 통해 평가자 조회
    const lineMapping = await this.evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'primary',
      })
      .andWhere('line.deletedAt IS NULL')
      .select('mapping.evaluatorId', 'evaluatorId')
      .getRawOne();

    return lineMapping?.evaluatorId || null;
  }

  /**
   * 2차평가자들을 조회한다
   */
  private async 이차평가자들을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<string[]> {
    // EvaluationLineMapping을 사용하여 평가자 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      return [];
    }

    // SECONDARY 타입의 평가라인을 통해 평가자들 조회
    const lineMappings = await this.evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'secondary',
      })
      .andWhere('line.deletedAt IS NULL')
      .select('mapping.evaluatorId', 'evaluatorId')
      .getRawMany();

    return lineMappings.map((mapping) => mapping.evaluatorId);
  }

  /**
   * 평가기준 설정 단계 승인 상태를 변경한다
   */
  async 평가기준설정_확인상태를_변경한다(
    request: UpdateStepApprovalByStepRequest,
  ): Promise<void> {
    await this.단계별_확인상태를_변경한다({
      evaluationPeriodId: request.evaluationPeriodId,
      employeeId: request.employeeId,
      step: 'criteria',
      status: request.status,
      revisionComment: request.revisionComment,
      updatedBy: request.updatedBy,
    });
  }

  /**
   * 자기평가 단계 승인 상태를 변경한다
   */
  async 자기평가_확인상태를_변경한다(
    request: UpdateStepApprovalByStepRequest,
  ): Promise<void> {
    await this.단계별_확인상태를_변경한다({
      evaluationPeriodId: request.evaluationPeriodId,
      employeeId: request.employeeId,
      step: 'self',
      status: request.status,
      revisionComment: request.revisionComment,
      updatedBy: request.updatedBy,
    });
  }

  /**
   * 1차 하향평가 단계 승인 상태를 변경한다
   */
  async 일차하향평가_확인상태를_변경한다(
    request: UpdateStepApprovalByStepRequest,
  ): Promise<void> {
    await this.단계별_확인상태를_변경한다({
      evaluationPeriodId: request.evaluationPeriodId,
      employeeId: request.employeeId,
      step: 'primary',
      status: request.status,
      revisionComment: request.revisionComment,
      updatedBy: request.updatedBy,
    });
  }

  /**
   * 2차 하향평가 단계 승인 상태를 평가자별로 변경한다
   */
  async 이차하향평가_확인상태를_변경한다(
    request: UpdateSecondaryStepApprovalRequest,
  ): Promise<void> {
    this.logger.log(
      `2차 하향평가 확인 상태 변경 시작 - 평가기간: ${request.evaluationPeriodId}, 직원: ${request.employeeId}, 평가자: ${request.evaluatorId}, 상태: ${request.status}`,
    );

    // 1. 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId: request.evaluationPeriodId,
        employeeId: request.employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `평가기간-직원 맵핑을 찾을 수 없습니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId})`,
      );
    }

    // 2. 평가자 검증 - 해당 평가자가 실제로 2차 평가자인지 확인
    const isSecondaryEvaluator = await this.평가자가_2차평가자인지_확인한다(
      request.evaluationPeriodId,
      request.employeeId,
      request.evaluatorId,
    );

    if (!isSecondaryEvaluator) {
      throw new NotFoundException(
        `해당 평가자는 2차 평가자가 아닙니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId}, 평가자 ID: ${request.evaluatorId})`,
      );
    }

    // 3. 단계 승인 정보 조회 또는 생성
    let stepApproval =
      await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);

    if (!stepApproval) {
      this.logger.log(
        `단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}`,
      );
      stepApproval = await this.stepApprovalService.생성한다({
        evaluationPeriodEmployeeMappingId: mapping.id,
        createdBy: request.updatedBy,
      });
    }

    // 4. 단계 상태 변경 (2차 평가)
    this.stepApprovalService.단계_상태를_변경한다(
      stepApproval,
      'secondary',
      request.status,
      request.updatedBy,
    );

    // 5. 저장
    await this.stepApprovalService.저장한다(stepApproval);

    // 6. revision_requested인 경우 특정 평가자에게만 재작성 요청 생성
    if (request.status === StepApprovalStatus.REVISION_REQUESTED) {
      if (!request.revisionComment || request.revisionComment.trim() === '') {
        throw new NotFoundException('재작성 요청 코멘트는 필수입니다.');
      }

      await this.재작성요청을_평가자별로_생성한다(
        request.evaluationPeriodId,
        request.employeeId,
        request.evaluatorId,
        request.revisionComment,
        request.updatedBy,
      );
    }

    this.logger.log(
      `2차 하향평가 확인 상태 변경 완료 - 직원: ${request.employeeId}, 평가자: ${request.evaluatorId}`,
    );
  }

  /**
   * 평가자가 2차 평가자인지 확인한다
   */
  private async 평가자가_2차평가자인지_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
  ): Promise<boolean> {
    const lineMapping = await this.evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'secondary',
      })
      .andWhere('line.deletedAt IS NULL')
      .getOne();

    return !!lineMapping;
  }

  /**
   * 재작성 요청을 특정 평가자에게만 생성한다 (평가자별 부분 처리)
   */
  private async 재작성요청을_평가자별로_생성한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    comment: string,
    requestedBy: string,
  ): Promise<void> {
    this.logger.log(
      `재작성 요청 생성 시작 (평가자별) - 직원: ${employeeId}, 평가자: ${evaluatorId}`,
    );

    // 특정 평가자에게만 재작성 요청 전송
    const recipients = [
      {
        recipientId: evaluatorId,
        recipientType: RecipientType.SECONDARY_EVALUATOR,
      },
    ];

    // 재작성 요청 생성
    await this.revisionRequestService.생성한다({
      evaluationPeriodId,
      employeeId,
      step: 'secondary',
      comment,
      requestedBy,
      recipients,
      createdBy: requestedBy,
    });

    this.logger.log(
      `재작성 요청 생성 완료 (평가자별) - 직원: ${employeeId}, 평가자: ${evaluatorId}`,
    );
  }
}

