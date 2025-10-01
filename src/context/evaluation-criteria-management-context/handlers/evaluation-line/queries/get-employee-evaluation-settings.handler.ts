import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationLineMapping } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
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
    @InjectRepository(EvaluationProjectAssignment)
    private readonly evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
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
          this.evaluationProjectAssignmentRepository.find({
            where: { employeeId, periodId },
            order: { createdAt: 'DESC' },
          }),
          this.evaluationWbsAssignmentRepository.find({
            where: { employeeId, periodId },
            order: { createdAt: 'DESC' },
          }),
          this.evaluationLineMappingRepository.find({
            where: { employeeId },
            order: { createdAt: 'DESC' },
          }),
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
