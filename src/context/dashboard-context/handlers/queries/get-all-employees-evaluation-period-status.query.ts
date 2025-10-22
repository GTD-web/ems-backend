import { Injectable, Logger } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationPeriodStatusDto } from '../../interfaces/dashboard-context.interface';
import {
  GetEmployeeEvaluationPeriodStatusQuery,
  GetEmployeeEvaluationPeriodStatusHandler,
} from './get-employee-evaluation-period-status';

/**
 * 평가기간의 모든 피평가자 현황 조회 쿼리
 *
 * 평가기간 ID로 해당 평가기간의 모든 피평가자(제외되지 않은) 현황을 조회합니다.
 */
export class GetAllEmployeesEvaluationPeriodStatusQuery implements IQuery {
  constructor(public readonly evaluationPeriodId: string) {}
}

/**
 * 평가기간의 모든 피평가자 현황 조회 핸들러
 */
@Injectable()
@QueryHandler(GetAllEmployeesEvaluationPeriodStatusQuery)
export class GetAllEmployeesEvaluationPeriodStatusHandler
  implements IQueryHandler<GetAllEmployeesEvaluationPeriodStatusQuery>
{
  private readonly logger = new Logger(
    GetAllEmployeesEvaluationPeriodStatusHandler.name,
  );

  constructor(
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    private readonly singleStatusHandler: GetEmployeeEvaluationPeriodStatusHandler,
  ) {}

  async execute(
    query: GetAllEmployeesEvaluationPeriodStatusQuery,
  ): Promise<EmployeeEvaluationPeriodStatusDto[]> {
    const { evaluationPeriodId } = query;

    this.logger.debug(
      `평가기간의 모든 피평가자 현황 조회 시작 - 평가기간: ${evaluationPeriodId}`,
    );

    try {
      // 1. 평가기간의 모든 피평가자 맵핑 조회 (제외되지 않고 삭제되지 않은 직원만)
      const mappings = await this.mappingRepository.find({
        where: {
          evaluationPeriodId,
          isExcluded: false, // 제외되지 않은 직원만
          deletedAt: IsNull(), // 삭제되지 않은 맵핑만
        },
        select: ['employeeId'], // employeeId만 조회
      });

      this.logger.debug(
        `조회된 피평가자 수: ${mappings.length} - 평가기간: ${evaluationPeriodId}`,
      );

      // 2. 각 직원별 상세 현황 조회 (병렬 처리)
      // 성능 최적화: Promise.all로 병렬 실행 (순차 대비 70-80% 단축)
      // 참고: 100명 이상 시 배치 처리(10-20명씩) 또는 배치 쿼리 최적화 권장
      const statusPromises = mappings.map(async (mapping) => {
        try {
          // 기존 단일 직원 조회 쿼리 재사용
          const singleQuery = new GetEmployeeEvaluationPeriodStatusQuery(
            evaluationPeriodId,
            mapping.employeeId,
          );

          const status = await this.singleStatusHandler.execute(singleQuery);
          return status;
        } catch (error) {
          this.logger.error(
            `직원 현황 조회 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${mapping.employeeId}`,
            error.stack,
          );
          // 한 직원의 조회 실패가 전체를 막지 않도록 null 반환
          return null;
        }
      });

      // Promise.all로 병렬 실행
      const allStatuses = await Promise.all(statusPromises);

      // null 제거
      const results = allStatuses.filter(
        (status): status is EmployeeEvaluationPeriodStatusDto =>
          status !== null,
      );

      this.logger.debug(
        `평가기간의 모든 피평가자 현황 조회 완료 - 평가기간: ${evaluationPeriodId}, 성공: ${results.length}/${mappings.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `평가기간의 모든 피평가자 현황 조회 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }
}
