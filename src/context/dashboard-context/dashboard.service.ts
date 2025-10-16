import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  IDashboardContext,
  EmployeeEvaluationPeriodStatusDto,
  MyEvaluationTargetStatusDto,
} from './interfaces/dashboard-context.interface';
import {
  GetEmployeeEvaluationPeriodStatusQuery,
  GetAllEmployeesEvaluationPeriodStatusQuery,
  GetMyEvaluationTargetsStatusQuery,
} from './handlers/queries';

/**
 * 대시보드 서비스
 *
 * 평가 관련 대시보드 정보를 제공하는 서비스입니다.
 * CQRS 패턴을 사용하여 쿼리를 처리합니다.
 */
@Injectable()
export class DashboardService implements IDashboardContext {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * 직원의 평가기간 현황을 조회한다
   */
  async 직원의_평가기간_현황을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<EmployeeEvaluationPeriodStatusDto | null> {
    const query = new GetEmployeeEvaluationPeriodStatusQuery(
      evaluationPeriodId,
      employeeId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 평가기간의 모든 피평가자 현황을 조회한다 (제외된 직원 제외)
   */
  async 평가기간의_모든_피평가자_현황을_조회한다(
    evaluationPeriodId: string,
  ): Promise<EmployeeEvaluationPeriodStatusDto[]> {
    const query = new GetAllEmployeesEvaluationPeriodStatusQuery(
      evaluationPeriodId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 내가 담당하는 평가 대상자 현황을 조회한다
   */
  async 내가_담당하는_평가대상자_현황을_조회한다(
    evaluationPeriodId: string,
    evaluatorId: string,
  ): Promise<MyEvaluationTargetStatusDto[]> {
    const query = new GetMyEvaluationTargetsStatusQuery(
      evaluationPeriodId,
      evaluatorId,
    );
    return await this.queryBus.execute(query);
  }
}
