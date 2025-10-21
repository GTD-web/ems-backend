import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';

/**
 * 평가기간별 평가자 목록 조회 쿼리
 */
export class GetEvaluatorsByPeriodQuery {
  constructor(
    public readonly periodId: string,
    public readonly type: 'primary' | 'secondary' | 'all',
  ) {}
}

/**
 * 평가기간별 평가자 정보
 */
export interface EvaluatorInfo {
  /** 평가자 ID */
  evaluatorId: string;
  /** 평가자 이름 */
  evaluatorName: string;
  /** 부서명 */
  departmentName: string;
  /** 평가자 유형 */
  evaluatorType: 'primary' | 'secondary';
  /** 담당 피평가자 수 */
  evaluateeCount: number;
}

/**
 * 평가기간별 평가자 목록 조회 결과
 */
export interface EvaluatorsByPeriodResult {
  /** 평가기간 ID */
  periodId: string;
  /** 조회 타입 */
  type: 'primary' | 'secondary' | 'all';
  /** 평가자 목록 */
  evaluators: EvaluatorInfo[];
}

@QueryHandler(GetEvaluatorsByPeriodQuery)
export class GetEvaluatorsByPeriodHandler
  implements IQueryHandler<GetEvaluatorsByPeriodQuery, EvaluatorsByPeriodResult>
{
  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async execute(
    query: GetEvaluatorsByPeriodQuery,
  ): Promise<EvaluatorsByPeriodResult> {
    // 1. 평가라인 조회 (타입에 따라 필터링)
    const evaluationLinesQuery =
      this.evaluationLineRepository.createQueryBuilder('line');

    if (query.type === 'primary') {
      evaluationLinesQuery.where('line.evaluatorType = :type', {
        type: EvaluatorType.PRIMARY,
      });
    } else if (query.type === 'secondary') {
      evaluationLinesQuery.where('line.evaluatorType = :type', {
        type: EvaluatorType.SECONDARY,
      });
    } else {
      // all
      evaluationLinesQuery.where('line.evaluatorType IN (:...types)', {
        types: [EvaluatorType.PRIMARY, EvaluatorType.SECONDARY],
      });
    }

    const evaluationLines = await evaluationLinesQuery.getMany();

    if (evaluationLines.length === 0) {
      return {
        periodId: query.periodId,
        type: query.type,
        evaluators: [],
      };
    }

    const lineIds = evaluationLines.map((line) => line.id);
    const lineTypeMap = new Map<string, 'primary' | 'secondary'>(
      evaluationLines.map((line) => [
        line.id,
        (line.evaluatorType === EvaluatorType.PRIMARY
          ? 'primary'
          : 'secondary') as 'primary' | 'secondary',
      ]),
    );

    // 2. 해당 평가기간의 WBS 할당 조회
    const wbsAssignments = await this.evaluationWbsAssignmentRepository.find({
      where: { periodId: query.periodId },
    });

    if (wbsAssignments.length === 0) {
      return {
        periodId: query.periodId,
        type: query.type,
        evaluators: [],
      };
    }

    const wbsItemIds = wbsAssignments.map((assignment) => assignment.wbsItemId);

    // 3. 평가라인 매핑 조회 (해당 평가기간의 WBS에만 해당)
    const mappings = await this.evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.evaluationLineId IN (:...lineIds)', {
        lineIds,
      })
      .andWhere('mapping.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
      .getMany();

    if (mappings.length === 0) {
      return {
        periodId: query.periodId,
        type: query.type,
        evaluators: [],
      };
    }

    // 4. 평가자별로 그룹화하여 피평가자 수 계산
    const evaluatorMap = new Map<
      string,
      {
        evaluatorId: string;
        evaluatorType: 'primary' | 'secondary';
        evaluateeCount: number;
      }
    >();

    mappings.forEach((mapping) => {
      const evaluatorId = mapping.evaluatorId;
      const evaluatorType = lineTypeMap.get(mapping.evaluationLineId)!;

      // 평가자별로 집계 (primary, secondary를 각각 다른 entry로 처리)
      const key = `${evaluatorId}-${evaluatorType}`;

      if (!evaluatorMap.has(key)) {
        evaluatorMap.set(key, {
          evaluatorId,
          evaluatorType,
          evaluateeCount: 0,
        });
      }
      const evaluator = evaluatorMap.get(key)!;
      evaluator.evaluateeCount++;
    });

    // 5. 평가자 정보 조회 (이름, 부서)
    const evaluatorIds = [
      ...new Set(Array.from(evaluatorMap.values()).map((e) => e.evaluatorId)),
    ];
    const employees = await this.employeeRepository.find({
      where: evaluatorIds.map((id) => ({ id })),
    });

    // 부서 정보 조회
    const departmentIds = [
      ...new Set(
        employees
          .map((emp) => emp.departmentId)
          .filter((id): id is string => !!id),
      ),
    ];
    const departments = await this.departmentRepository.find({
      where: departmentIds.map((externalId) => ({ externalId })),
    });

    const departmentMap = new Map(
      departments.map((dept) => [dept.externalId, dept.name]),
    );

    const employeeMap = new Map(employees.map((emp) => [emp.id, emp]));

    // 6. 최종 결과 조합
    const evaluators: EvaluatorInfo[] = Array.from(evaluatorMap.values()).map(
      (evaluatorData) => {
        const employee = employeeMap.get(evaluatorData.evaluatorId)!;
        return {
          evaluatorId: employee.id,
          evaluatorName: employee.name,
          departmentName: employee.departmentId
            ? departmentMap.get(employee.departmentId) || '미지정'
            : '미지정',
          evaluatorType: evaluatorData.evaluatorType,
          evaluateeCount: evaluatorData.evaluateeCount,
        };
      },
    );

    return {
      periodId: query.periodId,
      type: query.type,
      evaluators,
    };
  }
}

/**
 * @deprecated GetEvaluatorsByPeriodQuery 사용 권장
 */
export class GetPrimaryEvaluatorsByPeriodQuery extends GetEvaluatorsByPeriodQuery {
  constructor(periodId: string) {
    super(periodId, 'primary');
  }
}

/**
 * @deprecated GetEvaluatorsByPeriodHandler 사용 권장
 */
export class GetPrimaryEvaluatorsByPeriodHandler extends GetEvaluatorsByPeriodHandler {}

/**
 * @deprecated EvaluatorInfo 사용 권장
 */
export interface PrimaryEvaluatorInfo extends EvaluatorInfo {}

/**
 * @deprecated EvaluatorsByPeriodResult 사용 권장
 */
export interface PrimaryEvaluatorsByPeriodResult
  extends EvaluatorsByPeriodResult {}
