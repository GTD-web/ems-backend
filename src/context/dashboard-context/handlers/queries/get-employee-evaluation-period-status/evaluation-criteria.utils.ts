import {
  EvaluationCriteriaStatus,
  WbsCriteriaStatus,
  EvaluationLineStatus,
} from '../../../interfaces/dashboard-context.interface';

/**
 * 평가항목 상태를 계산한다
 * - 프로젝트와 WBS 모두 있으면: complete (존재)
 * - 프로젝트나 WBS 중 하나만 있으면: in_progress (설정중)
 * - 둘 다 없으면: none (미존재)
 */
export function 평가항목_상태를_계산한다(
  projectCount: number,
  wbsCount: number,
): EvaluationCriteriaStatus {
  const hasProject = projectCount > 0;
  const hasWbs = wbsCount > 0;

  if (hasProject && hasWbs) {
    return 'complete';
  } else if (hasProject || hasWbs) {
    return 'in_progress';
  } else {
    return 'none';
  }
}

/**
 * WBS 평가기준 상태를 계산한다
 * - 모든 WBS에 평가기준이 있으면: complete (완료)
 * - 일부 WBS에만 평가기준이 있으면: in_progress (설정중)
 * - 평가기준이 없으면: none (미존재)
 */
export function WBS평가기준_상태를_계산한다(
  totalWbsCount: number,
  wbsWithCriteriaCount: number,
): WbsCriteriaStatus {
  if (totalWbsCount === 0) {
    return 'none';
  }

  if (wbsWithCriteriaCount === 0) {
    return 'none';
  } else if (wbsWithCriteriaCount === totalWbsCount) {
    return 'complete';
  } else {
    return 'in_progress';
  }
}

/**
 * 평가기준 설정 상태를 계산한다
 * - 3개 항목(evaluationCriteria, wbsCriteria, evaluationLine)의 상태와 승인 상태를 조합하여 계산
 * 
 * 계산 로직:
 * 1. 모두 none이면 → none
 * 2. 하나라도 in_progress나 complete이면 → in_progress
 * 3. 모두 complete이면서 승인상태가 pending이면 → pending
 * 4. 모두 complete이면서 승인상태가 approved이면 → approved
 * 5. 모두 complete이면서 승인상태가 revision_requested이면 → revision_requested
 * 6. 모두 complete이면서 승인상태가 revision_completed이면 → revision_completed
 */
export function 평가기준설정_상태를_계산한다(
  evaluationCriteriaStatus: EvaluationCriteriaStatus,
  wbsCriteriaStatus: WbsCriteriaStatus,
  evaluationLineStatus: EvaluationLineStatus,
  approvalStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed' | null,
): 'none' | 'in_progress' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed' {
  // 1. 모두 none이면 → none
  if (
    evaluationCriteriaStatus === 'none' &&
    wbsCriteriaStatus === 'none' &&
    evaluationLineStatus === 'none'
  ) {
    return 'none';
  }

  // 2. 모두 complete인지 확인
  const allComplete =
    evaluationCriteriaStatus === 'complete' &&
    wbsCriteriaStatus === 'complete' &&
    evaluationLineStatus === 'complete';

  // 3. 모두 complete이면 승인 상태에 따라 반환
  if (allComplete) {
    // 승인 상태가 없으면 pending
    if (!approvalStatus) {
      return 'pending';
    }
    return approvalStatus;
  }

  // 4. 하나라도 in_progress나 complete이면 → in_progress
  return 'in_progress';
}
