import { Repository, IsNull } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { Project } from '@domain/common/project/project.entity';
import { PerformanceInputStatus } from '../../../interfaces/dashboard-context.interface';

/**
 * 성과 입력 상태를 조회한다
 * 평가기간과 직원에 해당하는 WBS 자기평가의 성과 입력 현황을 조회
 * (소프트 딜리트된 프로젝트 제외)
 */
export async function 성과입력_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
): Promise<{ totalWbsCount: number; inputCompletedCount: number }> {
  // 전체 WBS 자기평가 수 조회 (소프트 딜리트된 프로젝트 및 취소된 프로젝트 할당 제외)
  const totalWbsCount = await wbsSelfEvaluationRepository
    .createQueryBuilder('evaluation')
    .leftJoin(WbsItem, 'wbs', 'wbs.id = evaluation.wbsItemId AND wbs.deletedAt IS NULL')
    .leftJoin(Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
    .leftJoin(
      EvaluationProjectAssignment,
      'projectAssignment',
      'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = evaluation.periodId AND projectAssignment.employeeId = evaluation.employeeId AND projectAssignment.deletedAt IS NULL',
    )
    .where('evaluation.periodId = :periodId', { periodId: evaluationPeriodId })
    .andWhere('evaluation.employeeId = :employeeId', { employeeId })
    .andWhere('evaluation.deletedAt IS NULL')
    .andWhere('project.id IS NOT NULL') // 프로젝트가 존재하는 경우만 카운트
    .andWhere('projectAssignment.id IS NOT NULL') // 프로젝트 할당이 존재하는 경우만 카운트
    .getCount();

  // 성과가 입력된 WBS 수 조회 (performanceResult가 null이 아니고 비어있지 않은 것, 소프트 딜리트된 프로젝트 및 취소된 프로젝트 할당 제외)
  const selfEvaluations = await wbsSelfEvaluationRepository
    .createQueryBuilder('evaluation')
    .leftJoin(WbsItem, 'wbs', 'wbs.id = evaluation.wbsItemId AND wbs.deletedAt IS NULL')
    .leftJoin(Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
    .leftJoin(
      EvaluationProjectAssignment,
      'projectAssignment',
      'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = evaluation.periodId AND projectAssignment.employeeId = evaluation.employeeId AND projectAssignment.deletedAt IS NULL',
    )
    .where('evaluation.periodId = :periodId', { periodId: evaluationPeriodId })
    .andWhere('evaluation.employeeId = :employeeId', { employeeId })
    .andWhere('evaluation.deletedAt IS NULL')
    .andWhere('project.id IS NOT NULL') // 프로젝트가 존재하는 경우만 조회
    .andWhere('projectAssignment.id IS NOT NULL') // 프로젝트 할당이 존재하는 경우만 조회
    .getMany();

  const inputCompletedCount = selfEvaluations.filter(
    (evaluation) =>
      evaluation.performanceResult &&
      evaluation.performanceResult.trim().length > 0,
  ).length;

  return { totalWbsCount, inputCompletedCount };
}

/**
 * 성과 입력 상태를 계산한다
 * - 전체 WBS에 성과가 입력되고 완료됨: complete (완료)
 * - 일부 WBS에만 성과가 입력됨: in_progress (입력중)
 * - 모든 WBS에 성과가 입력되지 않음: none (미존재)
 */
export function 성과입력_상태를_계산한다(
  totalWbsCount: number,
  inputCompletedCount: number,
): PerformanceInputStatus {
  if (totalWbsCount === 0) {
    return 'none';
  }

  if (inputCompletedCount === 0) {
    return 'none';
  } else if (inputCompletedCount === totalWbsCount) {
    return 'complete';
  } else {
    return 'in_progress';
  }
}
