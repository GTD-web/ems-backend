import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriod } from '../../../../../domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '../../../../../domain/common/employee/employee.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '../../../../../domain/core/evaluation-period/evaluation-period.types';

/**
 * 평가 대상 여부 확인 쿼리
 */
export class CheckEvaluationTargetQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
  ) {}
}

/**
 * 평가 대상 여부 확인 결과 타입
 */
export type CheckEvaluationTargetResult = {
  isEvaluationTarget: boolean;
  evaluationPeriod: {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date | null;
    status: EvaluationPeriodStatus;
    currentPhase?: EvaluationPeriodPhase | null;
  };
  employee: {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    departmentName?: string;
    rankName?: string;
    status: string;
  };
};

/**
 * 평가 대상 여부 확인 쿼리 핸들러
 *
 * 특정 평가기간에 특정 직원이 평가 대상인지 확인한다
 */
@QueryHandler(CheckEvaluationTargetQuery)
export class CheckEvaluationTargetHandler
  implements
    IQueryHandler<CheckEvaluationTargetQuery, CheckEvaluationTargetResult>
{
  private readonly logger = new Logger(CheckEvaluationTargetHandler.name);

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(
    query: CheckEvaluationTargetQuery,
  ): Promise<CheckEvaluationTargetResult> {
    const { evaluationPeriodId, employeeId } = query;

    this.logger.debug(
      `평가 대상 여부 확인 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      // 1. 평가 대상 여부 확인
      const isTarget =
        await this.evaluationPeriodEmployeeMappingService.평가대상_여부를_확인한다(
          evaluationPeriodId,
          employeeId,
        );

      // 2. 평가기간 정보 조회
      const period = await this.evaluationPeriodRepository.findOne({
        where: { id: evaluationPeriodId, deletedAt: IsNull() },
      });

      // 3. 직원 정보 조회
      const employee = await this.employeeRepository.findOne({
        where: { id: employeeId, deletedAt: IsNull() },
      });

      this.logger.debug(
        `평가 대상 여부 확인 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 결과: ${isTarget}`,
      );

      return {
        isEvaluationTarget: isTarget,
        evaluationPeriod: {
          id: period?.id || evaluationPeriodId,
          name: period?.name || '알 수 없음',
          startDate: period?.startDate || new Date(),
          status: period?.status || EvaluationPeriodStatus.WAITING,
          currentPhase: period?.currentPhase || null,
        },
        employee: {
          id: employee?.id || employeeId,
          employeeNumber: employee?.employeeNumber || '',
          name: employee?.name || '알 수 없음',
          email: employee?.email || '',
          departmentName: employee?.departmentName,
          rankName: employee?.rankName,
          status: employee?.status || '',
        },
      };
    } catch (error) {
      this.logger.error(
        `평가 대상 여부 확인 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
