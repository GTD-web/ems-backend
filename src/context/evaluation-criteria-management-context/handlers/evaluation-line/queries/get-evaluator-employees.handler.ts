import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationLineMapping } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';

/**
 * 평가자별 피평가자 목록 조회 쿼리
 */
export class GetEvaluatorEmployeesQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly evaluatorId: string,
  ) {}
}

/**
 * 평가자별 피평가자 목록 조회 결과
 */
export interface EvaluatorEmployeesResult {
  /** 평가자 ID */
  evaluatorId: string;
  /** 피평가자 목록 */
  employees: {
    /** 피평가자 ID */
    employeeId: string;
    /** WBS 항목 ID (선택적) */
    wbsItemId?: string;
    /** 평가 라인 ID */
    evaluationLineId: string;
    /** 생성자 ID */
    createdBy?: string;
    /** 수정자 ID */
    updatedBy?: string;
    /** 생성 일시 */
    createdAt: Date;
    /** 수정 일시 */
    updatedAt: Date;
  }[];
}

@QueryHandler(GetEvaluatorEmployeesQuery)
export class GetEvaluatorEmployeesHandler
  implements IQueryHandler<GetEvaluatorEmployeesQuery, EvaluatorEmployeesResult>
{
  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  ) {}

  async execute(
    query: GetEvaluatorEmployeesQuery,
  ): Promise<EvaluatorEmployeesResult> {
    const mappings = await this.evaluationLineMappingRepository.find({
      where: { 
        evaluationPeriodId: query.evaluationPeriodId,
        evaluatorId: query.evaluatorId 
      },
      order: { createdAt: 'DESC' },
    });

    // 피평가자별로 그룹화
    const employeeMap = new Map<string, any>();

    mappings.forEach((mapping) => {
      const dto = mapping.DTO로_변환한다();
      const key = `${dto.employeeId}-${dto.wbsItemId || 'no-wbs'}`;

      if (!employeeMap.has(key)) {
        employeeMap.set(key, {
          employeeId: dto.employeeId,
          wbsItemId: dto.wbsItemId,
          evaluationLineId: dto.evaluationLineId,
          createdBy: dto.createdBy,
          updatedBy: dto.updatedBy,
          createdAt: dto.createdAt,
          updatedAt: dto.updatedAt,
        });
      }
    });

    return {
      evaluatorId: query.evaluatorId,
      employees: Array.from(employeeMap.values()),
    };
  }
}
