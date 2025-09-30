import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluationLineMappingService } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import type { EvaluationProjectAssignmentDto } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import type { EvaluationWbsAssignmentDto } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type { EvaluationLineMappingDto } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';

/**
 * 직원의 평가설정 조회 쿼리
 */
export class GetEmployeeEvaluationSettingsQuery {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * 직원의 평가설정 조회 결과
 */
export interface EmployeeEvaluationSettingsResult {
  projectAssignments: EvaluationProjectAssignmentDto[];
  wbsAssignments: EvaluationWbsAssignmentDto[];
  evaluationLineMappings: EvaluationLineMappingDto[];
}

/**
 * 직원의 평가설정 조회 쿼리 핸들러
 */
@QueryHandler(GetEmployeeEvaluationSettingsQuery)
export class GetEmployeeEvaluationSettingsHandler
  implements
    IQueryHandler<
      GetEmployeeEvaluationSettingsQuery,
      EmployeeEvaluationSettingsResult
    >
{
  private readonly logger = new Logger(
    GetEmployeeEvaluationSettingsHandler.name,
  );

  constructor(
    private readonly evaluationProjectAssignmentService: EvaluationProjectAssignmentService,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
  ) {}

  async execute(
    query: GetEmployeeEvaluationSettingsQuery,
  ): Promise<EmployeeEvaluationSettingsResult> {
    const { employeeId, periodId } = query;

    this.logger.debug(
      `직원의 평가설정 조회 시작 - 직원 ID: ${employeeId}, 평가기간: ${periodId}`,
    );

    try {
      const [projectAssignments, wbsAssignments, evaluationLineMappings] =
        await Promise.all([
          this.evaluationProjectAssignmentService.필터_조회한다({
            employeeId,
            periodId,
          }),
          this.evaluationWbsAssignmentService.필터_조회한다({
            employeeId,
            periodId,
          }),
          this.evaluationLineMappingService.직원별_조회한다(employeeId),
        ]);

      const result = {
        projectAssignments: projectAssignments.map((assignment) =>
          assignment.DTO로_변환한다(),
        ),
        wbsAssignments: wbsAssignments.map((assignment) =>
          assignment.DTO로_변환한다(),
        ),
        evaluationLineMappings: evaluationLineMappings.map((mapping) =>
          mapping.DTO로_변환한다(),
        ),
      };

      this.logger.debug(
        `직원의 평가설정 조회 완료 - 직원 ID: ${employeeId}, 프로젝트 할당: ${result.projectAssignments.length}, WBS 할당: ${result.wbsAssignments.length}, 평가라인 매핑: ${result.evaluationLineMappings.length}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `직원의 평가설정 조회 실패 - 직원 ID: ${employeeId}, 평가기간: ${periodId}`,
        error.stack,
      );
      throw error;
    }
  }
}
