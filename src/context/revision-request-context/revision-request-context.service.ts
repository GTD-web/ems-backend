import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationRevisionRequestService } from '@domain/sub/evaluation-revision-request';
import {
  EmployeeEvaluationStepApprovalService,
  StepApprovalStatus,
} from '@domain/sub/employee-evaluation-step-approval';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import type {
  IRevisionRequestContext,
  RevisionRequestWithDetailsDto,
  GetRevisionRequestsFilter,
} from './interfaces/revision-request-context.interface';

/**
 * 재작성 요청 컨텍스트 서비스
 * 재작성 요청 조회, 읽음 처리, 재작성 완료 응답을 담당합니다.
 */
@Injectable()
export class RevisionRequestContextService implements IRevisionRequestContext {
  private readonly logger = new Logger(RevisionRequestContextService.name);

  constructor(
    private readonly revisionRequestService: EvaluationRevisionRequestService,
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
  ) {}

  /**
   * 전체 재작성 요청 목록을 조회한다 (관리자용)
   */
  async 전체_재작성요청목록을_조회한다(
    filter?: GetRevisionRequestsFilter,
  ): Promise<RevisionRequestWithDetailsDto[]> {
    this.logger.log('전체 재작성 요청 목록 조회');

    // 재작성 요청 목록 조회 (수신자 정보 포함)
    const requests = await this.revisionRequestService.필터로_조회한다({
      evaluationPeriodId: filter?.evaluationPeriodId,
      employeeId: filter?.employeeId,
      step: filter?.step,
      requestedBy: filter?.requestedBy,
    });

    // 각 요청의 모든 수신자에 대해 상세 정보 조회
    const result: RevisionRequestWithDetailsDto[] = [];

    for (const request of requests) {
      // 피평가자 정보 조회
      const employee = await this.employeeRepository.findOne({
        where: { id: request.employeeId, deletedAt: null as any },
      });

      if (!employee) {
        this.logger.warn(
          `피평가자를 찾을 수 없습니다. - 직원 ID: ${request.employeeId}`,
        );
        continue;
      }

      // 평가기간 정보 조회
      const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
        where: { id: request.evaluationPeriodId, deletedAt: null as any },
      });

      if (!evaluationPeriod) {
        this.logger.warn(
          `평가기간을 찾을 수 없습니다. - 평가기간 ID: ${request.evaluationPeriodId}`,
        );
        continue;
      }

      // 각 수신자별로 필터링 및 항목 생성
      for (const recipient of request.recipients || []) {
        // 삭제된 수신자는 제외
        if (recipient.deletedAt) {
          continue;
        }

        // 필터 적용
        if (filter?.isRead !== undefined && recipient.isRead !== filter.isRead) {
          continue;
        }

        if (
          filter?.isCompleted !== undefined &&
          recipient.isCompleted !== filter.isCompleted
        ) {
          continue;
        }

        result.push({
          request: request.DTO로_변환한다(),
          recipientInfo: recipient.DTO로_변환한다(),
          employee: {
            id: employee.id,
            name: employee.name,
            employeeNumber: employee.employeeNumber,
            email: employee.email,
            departmentName: employee.departmentName,
            rankName: employee.rankName,
          },
          evaluationPeriod: {
            id: evaluationPeriod.id,
            name: evaluationPeriod.name,
          },
        });
      }
    }

    this.logger.log(
      `전체 재작성 요청 목록 조회 완료 - 요청 수: ${result.length}`,
    );

    return result;
  }

  /**
   * 내 재작성 요청 목록을 조회한다
   */
  async 내_재작성요청목록을_조회한다(
    recipientId: string,
    filter?: GetRevisionRequestsFilter,
  ): Promise<RevisionRequestWithDetailsDto[]> {
    this.logger.log(`내 재작성 요청 목록 조회 - 수신자 ID: ${recipientId}`);

    // 수신자의 재작성 요청 목록 조회
    const recipients =
      await this.revisionRequestService.수신자의_요청목록을_조회한다(
        recipientId,
        {
          isRead: filter?.isRead,
          isCompleted: filter?.isCompleted,
          evaluationPeriodId: filter?.evaluationPeriodId,
          step: filter?.step,
        },
      );

    // 각 요청에 대한 상세 정보 조회
    const result: RevisionRequestWithDetailsDto[] = [];

    for (const recipient of recipients) {
      const request = recipient.revisionRequest;

      // 피평가자 정보 조회
      const employee = await this.employeeRepository.findOne({
        where: { id: request.employeeId, deletedAt: null as any },
      });

      if (!employee) {
        this.logger.warn(
          `피평가자를 찾을 수 없습니다. - 직원 ID: ${request.employeeId}`,
        );
        continue;
      }

      // 평가기간 정보 조회
      const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
        where: { id: request.evaluationPeriodId, deletedAt: null as any },
      });

      if (!evaluationPeriod) {
        this.logger.warn(
          `평가기간을 찾을 수 없습니다. - 평가기간 ID: ${request.evaluationPeriodId}`,
        );
        continue;
      }

      result.push({
        request: request.DTO로_변환한다(),
        recipientInfo: recipient.DTO로_변환한다(),
        employee: {
          id: employee.id,
          name: employee.name,
          employeeNumber: employee.employeeNumber,
          email: employee.email,
          departmentName: employee.departmentName,
          rankName: employee.rankName,
        },
        evaluationPeriod: {
          id: evaluationPeriod.id,
          name: evaluationPeriod.name,
        },
      });
    }

    this.logger.log(
      `내 재작성 요청 목록 조회 완료 - 수신자 ID: ${recipientId}, 요청 수: ${result.length}`,
    );

    return result;
  }

  /**
   * 읽지 않은 재작성 요청 수를 조회한다
   */
  async 읽지않은_재작성요청수를_조회한다(
    recipientId: string,
  ): Promise<number> {
    this.logger.log(`읽지 않은 재작성 요청 수 조회 - 수신자 ID: ${recipientId}`);

    const count =
      await this.revisionRequestService.읽지않은_요청수를_조회한다(recipientId);

    this.logger.log(
      `읽지 않은 재작성 요청 수 조회 완료 - 수신자 ID: ${recipientId}, 수: ${count}`,
    );

    return count;
  }

  /**
   * 재작성 요청을 읽음 처리한다
   */
  async 재작성요청을_읽음처리한다(
    requestId: string,
    recipientId: string,
  ): Promise<void> {
    this.logger.log(
      `재작성 요청 읽음 처리 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );

    // 수신자 조회
    const recipient = await this.revisionRequestService.수신자를_조회한다(
      requestId,
      recipientId,
    );

    if (!recipient) {
      throw new NotFoundException(
        `재작성 요청 수신자를 찾을 수 없습니다. (요청 ID: ${requestId}, 수신자 ID: ${recipientId})`,
      );
    }

    // 권한 확인
    if (!recipient.특정수신자의_요청인가(recipientId)) {
      throw new ForbiddenException(
        `해당 재작성 요청에 접근할 권한이 없습니다. (요청 ID: ${requestId})`,
      );
    }

    // 읽음 처리
    recipient.읽음처리한다();

    // 저장
    await this.revisionRequestService.수신자를_저장한다(recipient);

    this.logger.log(
      `재작성 요청 읽음 처리 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );
  }

  /**
   * 재작성 완료 응답을 제출한다
   */
  async 재작성완료_응답을_제출한다(
    requestId: string,
    recipientId: string,
    responseComment: string,
  ): Promise<void> {
    this.logger.log(
      `재작성 완료 응답 제출 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );

    // 재작성 요청 조회
    const request = await this.revisionRequestService.ID로_조회한다(requestId);

    if (!request) {
      throw new NotFoundException(
        `재작성 요청을 찾을 수 없습니다. (요청 ID: ${requestId})`,
      );
    }

    // 수신자 조회
    const recipient = await this.revisionRequestService.수신자를_조회한다(
      requestId,
      recipientId,
    );

    if (!recipient) {
      throw new NotFoundException(
        `재작성 요청 수신자를 찾을 수 없습니다. (요청 ID: ${requestId}, 수신자 ID: ${recipientId})`,
      );
    }

    // 권한 확인
    if (!recipient.특정수신자의_요청인가(recipientId)) {
      throw new ForbiddenException(
        `해당 재작성 요청에 접근할 권한이 없습니다. (요청 ID: ${requestId})`,
      );
    }

    // 재작성 완료 응답
    recipient.재작성완료_응답한다(responseComment);

    // 저장
    await this.revisionRequestService.수신자를_저장한다(recipient);

    // 모든 수신자가 완료했는지 확인
    const allCompleted = await this.모든_수신자가_완료했는가(requestId);

    if (allCompleted) {
      // 단계 승인 상태를 REVISION_COMPLETED로 변경
      await this.단계_승인_상태를_재작성완료로_변경한다(
        request.evaluationPeriodId,
        request.employeeId,
        request.step,
        recipientId,
      );
    }

    this.logger.log(
      `재작성 완료 응답 제출 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );
  }

  /**
   * 모든 수신자가 완료했는지 확인한다
   */
  private async 모든_수신자가_완료했는가(
    requestId: string,
  ): Promise<boolean> {
    const request = await this.revisionRequestService.ID로_조회한다(requestId);

    if (!request || !request.recipients) {
      return false;
    }

    // 삭제되지 않은 수신자들만 확인
    const activeRecipients = request.recipients.filter(
      (r) => !r.deletedAt,
    );

    if (activeRecipients.length === 0) {
      return false;
    }

    // 모든 수신자가 완료했는지 확인
    return activeRecipients.every((r) => r.isCompleted);
  }

  /**
   * 단계 승인 상태를 재작성 완료로 변경한다
   */
  private async 단계_승인_상태를_재작성완료로_변경한다(
    evaluationPeriodId: string,
    employeeId: string,
    step: string,
    updatedBy: string,
  ): Promise<void> {
    this.logger.log(
      `단계 승인 상태를 재작성 완료로 변경 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step}`,
    );

    // 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      this.logger.warn(
        `평가기간-직원 맵핑을 찾을 수 없습니다. - 평가기간 ID: ${evaluationPeriodId}, 직원 ID: ${employeeId}`,
      );
      return;
    }

    // 단계 승인 정보 조회
    const stepApproval =
      await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);

    if (!stepApproval) {
      this.logger.warn(
        `단계 승인 정보를 찾을 수 없습니다. - 맵핑 ID: ${mapping.id}`,
      );
      return;
    }

    // 단계 타입 변환 (RevisionRequestStepType -> StepType)
    const stepType = step as 'criteria' | 'self' | 'primary' | 'secondary';

    // 단계 상태 변경
    this.stepApprovalService.단계_상태를_변경한다(
      stepApproval,
      stepType,
      StepApprovalStatus.REVISION_COMPLETED,
      updatedBy,
    );

    // 저장
    await this.stepApprovalService.저장한다(stepApproval);

    this.logger.log(
      `단계 승인 상태를 재작성 완료로 변경 완료 - 직원: ${employeeId}, 단계: ${step}`,
    );
  }
}

