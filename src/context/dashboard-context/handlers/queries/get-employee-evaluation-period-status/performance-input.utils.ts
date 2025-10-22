import { Repository, IsNull } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { PerformanceInputStatus } from '../../../interfaces/dashboard-context.interface';

/**
 * 성과 입력 상태를 조회한다
 * 평가기간과 직원에 해당하는 WBS 자기평가의 성과 입력 현황을 조회
 */
export async function 성과입력_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
): Promise<{ totalWbsCount: number; inputCompletedCount: number }> {
  // 전체 WBS 자기평가 수 조회
  const totalWbsCount = await wbsSelfEvaluationRepository.count({
    where: {
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      deletedAt: IsNull(),
    },
  });

  // 성과가 입력된 WBS 수 조회 (performanceResult가 null이 아니고 비어있지 않은 것)
  const selfEvaluations = await wbsSelfEvaluationRepository.find({
    where: {
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      deletedAt: IsNull(),
    },
  });

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
