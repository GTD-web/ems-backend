import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// 자기평가 관련 커맨드 및 쿼리
import {
  CreateWbsSelfEvaluationCommand,
  UpdateWbsSelfEvaluationCommand,
  SubmitWbsSelfEvaluationCommand,
  GetEmployeeSelfEvaluationsQuery,
  GetWbsSelfEvaluationDetailQuery,
} from './handlers/self-evaluation';

// 동료평가 관련 커맨드 및 쿼리
import {
  CreatePeerEvaluationCommand,
  UpdatePeerEvaluationCommand,
  SubmitPeerEvaluationCommand,
  GetPeerEvaluationListQuery,
  GetPeerEvaluationDetailQuery,
} from './handlers/peer-evaluation';

// 하향평가 관련 커맨드 및 쿼리
import {
  CreateDownwardEvaluationCommand,
  UpdateDownwardEvaluationCommand,
  SubmitDownwardEvaluationCommand,
  GetDownwardEvaluationListQuery,
  GetDownwardEvaluationDetailQuery,
} from './handlers/downward-evaluation';

import { IPerformanceEvaluationService } from './interfaces/performance-evaluation.interface';
import { WbsSelfEvaluationDto } from '@/domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { WbsSelfEvaluationMappingDto } from '@/domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.types';
import {
  WbsSelfEvaluationResponseDto,
  WbsSelfEvaluationBasicDto,
  EmployeeSelfEvaluationsResponseDto,
} from '@/interface/admin/performance-evaluation/dto/wbs-self-evaluation.dto';

/**
 * 성과평가 컨텍스트 서비스
 * 자기평가(성과입력), 동료평가, 하향평가를 관리합니다.
 */
@Injectable()
export class PerformanceEvaluationService
  implements IPerformanceEvaluationService
{
  private readonly logger = new Logger(PerformanceEvaluationService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ==================== 자기평가(성과입력) 관련 메서드 ====================

  /**
   * WBS 자기평가를 생성한다
   */
  async WBS자기평가를_생성한다(
    command: CreateWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationResponseDto> {
    this.logger.log('WBS 자기평가 생성 시작', {
      employeeId: command.employeeId,
      wbsItemId: command.wbsItemId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('WBS 자기평가 생성 완료', { evaluationId: result });
    return result;
  }

  /**
   * WBS 자기평가를 수정한다
   */
  async WBS자기평가를_수정한다(
    command: UpdateWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationBasicDto> {
    this.logger.log('WBS 자기평가 수정 시작', {
      evaluationId: command.evaluationId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('WBS 자기평가 수정 완료', {
      evaluationId: command.evaluationId,
    });
    return result;
  }

  /**
   * WBS 자기평가를 제출한다
   */
  async WBS자기평가를_제출한다(
    command: SubmitWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationResponseDto> {
    this.logger.log('WBS 자기평가 제출 시작', {
      evaluationId: command.evaluationId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('WBS 자기평가 제출 완료', {
      evaluationId: command.evaluationId,
    });
    return result;
  }

  /**
   * 직원의 자기평가 목록을 조회한다
   */
  async 직원의_자기평가_목록을_조회한다(
    query: GetEmployeeSelfEvaluationsQuery,
  ): Promise<EmployeeSelfEvaluationsResponseDto> {
    this.logger.log('직원 자기평가 목록 조회', {
      employeeId: query.employeeId,
    });
    return await this.queryBus.execute(query);
  }

  /**
   * WBS 자기평가 상세정보를 조회한다
   */
  async WBS자기평가_상세정보를_조회한다(
    query: GetWbsSelfEvaluationDetailQuery,
  ): Promise<any> {
    this.logger.log('WBS 자기평가 상세정보 조회', {
      evaluationId: query.evaluationId,
    });
    return await this.queryBus.execute(query);
  }

  // ==================== 동료평가 관련 메서드 ====================

  /**
   * 동료평가를 생성한다
   */
  async 동료평가를_생성한다(
    command: CreatePeerEvaluationCommand,
  ): Promise<string> {
    this.logger.log('동료평가 생성 시작', {
      evaluatorId: command.evaluatorId,
      evaluateeId: command.evaluateeId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('동료평가 생성 완료', { evaluationId: result });
    return result;
  }

  /**
   * 동료평가를 수정한다
   */
  async 동료평가를_수정한다(
    command: UpdatePeerEvaluationCommand,
  ): Promise<void> {
    this.logger.log('동료평가 수정 시작', {
      evaluationId: command.evaluationId,
    });

    await this.commandBus.execute(command);
    this.logger.log('동료평가 수정 완료', {
      evaluationId: command.evaluationId,
    });
  }

  /**
   * 동료평가를 제출한다
   */
  async 동료평가를_제출한다(
    command: SubmitPeerEvaluationCommand,
  ): Promise<void> {
    this.logger.log('동료평가 제출 시작', {
      evaluationId: command.evaluationId,
    });

    await this.commandBus.execute(command);
    this.logger.log('동료평가 제출 완료', {
      evaluationId: command.evaluationId,
    });
  }

  /**
   * 동료평가 목록을 조회한다
   */
  async 동료평가_목록을_조회한다(
    query: GetPeerEvaluationListQuery,
  ): Promise<any> {
    this.logger.log('동료평가 목록 조회', { evaluatorId: query.evaluatorId });
    return await this.queryBus.execute(query);
  }

  /**
   * 동료평가 상세정보를 조회한다
   */
  async 동료평가_상세정보를_조회한다(
    query: GetPeerEvaluationDetailQuery,
  ): Promise<any> {
    this.logger.log('동료평가 상세정보 조회', {
      evaluationId: query.evaluationId,
    });
    return await this.queryBus.execute(query);
  }

  // ==================== 하향평가 관련 메서드 ====================

  /**
   * 하향평가를 생성한다
   */
  async 하향평가를_생성한다(
    command: CreateDownwardEvaluationCommand,
  ): Promise<string> {
    this.logger.log('하향평가 생성 시작', {
      evaluatorId: command.evaluatorId,
      evaluateeId: command.evaluateeId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('하향평가 생성 완료', { evaluationId: result });
    return result;
  }

  /**
   * 하향평가를 수정한다
   */
  async 하향평가를_수정한다(
    command: UpdateDownwardEvaluationCommand,
  ): Promise<void> {
    this.logger.log('하향평가 수정 시작', {
      evaluationId: command.evaluationId,
    });

    await this.commandBus.execute(command);
    this.logger.log('하향평가 수정 완료', {
      evaluationId: command.evaluationId,
    });
  }

  /**
   * 하향평가를 제출한다
   */
  async 하향평가를_제출한다(
    command: SubmitDownwardEvaluationCommand,
  ): Promise<void> {
    this.logger.log('하향평가 제출 시작', {
      evaluationId: command.evaluationId,
    });

    await this.commandBus.execute(command);
    this.logger.log('하향평가 제출 완료', {
      evaluationId: command.evaluationId,
    });
  }

  /**
   * 하향평가 목록을 조회한다
   */
  async 하향평가_목록을_조회한다(
    query: GetDownwardEvaluationListQuery,
  ): Promise<any> {
    this.logger.log('하향평가 목록 조회', { evaluatorId: query.evaluatorId });
    return await this.queryBus.execute(query);
  }

  /**
   * 하향평가 상세정보를 조회한다
   */
  async 하향평가_상세정보를_조회한다(
    query: GetDownwardEvaluationDetailQuery,
  ): Promise<any> {
    this.logger.log('하향평가 상세정보 조회', {
      evaluationId: query.evaluationId,
    });
    return await this.queryBus.execute(query);
  }
}
