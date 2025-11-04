import { Repository, IsNull, Not } from 'typeorm';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { PeerEvaluationStatus } from '../../../interfaces/dashboard-context.interface';
import { PeerEvaluationStatus as DomainPeerEvaluationStatus } from '@domain/core/peer-evaluation/peer-evaluation.types';

/**
 * 동료평가 상태를 조회한다
 * 평가기간과 직원(피평가자)에 해당하는 동료평가의 전체 수와 완료된 수를 조회
 * 취소된 동료평가(status = 'cancelled')는 제외됩니다.
 */
export async function 동료평가_상태를_조회한다(
  evaluationPeriodId: string,
  employeeId: string,
  peerEvaluationRepository: Repository<PeerEvaluation>,
): Promise<{ totalRequestCount: number; completedRequestCount: number }> {
  // 활성화된 동료평가 요청 전체 수 조회
  // 취소된 동료평가(status = 'cancelled')는 제외
  // isActive = true, deletedAt IS NULL, status != 'cancelled'
  const totalRequestCount = await peerEvaluationRepository.count({
    where: {
      periodId: evaluationPeriodId,
      evaluateeId: employeeId,
      isActive: true,
      status: Not(DomainPeerEvaluationStatus.CANCELLED),
      deletedAt: IsNull(),
    },
  });

  // 완료된 동료평가 수 조회
  // 취소된 동료평가는 제외
  // isActive = true, isCompleted = true, status != 'cancelled', deletedAt IS NULL
  const completedRequestCount = await peerEvaluationRepository.count({
    where: {
      periodId: evaluationPeriodId,
      evaluateeId: employeeId,
      isActive: true,
      isCompleted: true,
      status: Not(DomainPeerEvaluationStatus.CANCELLED),
      deletedAt: IsNull(),
    },
  });

  return { totalRequestCount, completedRequestCount };
}

/**
 * 동료평가 상태를 계산한다
 * - 요청이 없으면: none (요청가능)
 * - 모든 동료평가가 완료되었으면: complete (완료)
 * - 일부만 완료되었거나 진행중: in_progress (입력중)
 */
export function 동료평가_상태를_계산한다(
  totalRequestCount: number,
  completedRequestCount: number,
): PeerEvaluationStatus {
  // 동료평가 요청이 없으면 요청가능
  if (totalRequestCount === 0) {
    return 'none';
  }

  // 모든 동료평가가 완료되었으면 완료
  if (completedRequestCount === totalRequestCount) {
    return 'complete';
  }

  // 일부만 완료되었거나 진행중
  return 'in_progress';
}
