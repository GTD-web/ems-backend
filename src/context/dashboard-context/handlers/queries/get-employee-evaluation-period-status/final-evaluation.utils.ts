import { Repository, IsNull } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { FinalEvaluationStatus } from '../../../interfaces/dashboard-context.interface';

/**
 * 최종평가를 조회한다
 * 평가기간과 직원에 해당하는 최종평가를 조회
 */
export async function 최종평가를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  finalEvaluationRepository: Repository<FinalEvaluation>,
): Promise<FinalEvaluation | null> {
  const finalEvaluation = await finalEvaluationRepository.findOne({
    where: {
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      deletedAt: IsNull(),
    },
  });

  return finalEvaluation;
}

/**
 * 최종평가 상태를 계산한다
 * - 최종평가가 없으면: none (미작성)
 * - 최종평가가 확정되었으면: complete (확정)
 * - 최종평가가 있지만 확정되지 않았으면: in_progress (작성중)
 */
export function 최종평가_상태를_계산한다(
  finalEvaluation: FinalEvaluation | null,
): FinalEvaluationStatus {
  // 최종평가가 없으면 미작성
  if (!finalEvaluation) {
    return 'none';
  }

  // 최종평가가 확정되었으면 확정
  if (finalEvaluation.isConfirmed) {
    return 'complete';
  }

  // 최종평가가 있지만 확정되지 않았으면 작성중
  return 'in_progress';
}
