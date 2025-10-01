import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationLineMapping } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import type { EvaluationLineMappingDto } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';

/**
 * 직원의 평가라인 매핑 조회 쿼리
 */
export class GetEmployeeEvaluationLineMappingsQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 직원의 평가라인 매핑 조회 쿼리 핸들러
 */
@QueryHandler(GetEmployeeEvaluationLineMappingsQuery)
export class GetEmployeeEvaluationLineMappingsHandler
  implements
    IQueryHandler<
      GetEmployeeEvaluationLineMappingsQuery,
      EvaluationLineMappingDto[]
    >
{
  private readonly logger = new Logger(
    GetEmployeeEvaluationLineMappingsHandler.name,
  );

  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  ) {}

  async execute(
    query: GetEmployeeEvaluationLineMappingsQuery,
  ): Promise<EvaluationLineMappingDto[]> {
    const { employeeId } = query;

    this.logger.debug(
      `직원의 평가라인 매핑 조회 시작 - 직원 ID: ${employeeId}`,
    );

    try {
      const mappings = await this.evaluationLineMappingRepository.find({
        where: { employeeId },
        order: { createdAt: 'DESC' },
      });
      const result = mappings.map((mapping) => mapping.DTO로_변환한다());

      this.logger.debug(
        `직원의 평가라인 매핑 조회 완료 - 직원 ID: ${employeeId}, 조회된 개수: ${mappings.length}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `직원의 평가라인 매핑 조회 실패 - 직원 ID: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
