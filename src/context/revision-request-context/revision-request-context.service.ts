import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationRevisionRequestService } from '@domain/sub/evaluation-revision-request';
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
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
  ) {}

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

    this.logger.log(
      `재작성 완료 응답 제출 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );
  }
}

