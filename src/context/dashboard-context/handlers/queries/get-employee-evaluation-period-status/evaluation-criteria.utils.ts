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
 * 평가기준 설정 진행 상태를 계산한다 (제출 및 승인 상태 제외)
 * - 2개 항목(evaluationCriteria, wbsCriteria)의 상태를 조합하여 계산
 * - 평가라인은 제외됨
 * 
 * 계산 로직:
 * 1. 모두 none이면 → none
 * 2. 하나라도 in_progress나 complete이면 → in_progress
 * 3. 모두 complete이면 → complete
 */
export function 평가기준설정_진행_상태를_계산한다(
  evaluationCriteriaStatus: EvaluationCriteriaStatus,
  wbsCriteriaStatus: WbsCriteriaStatus,
): 'none' | 'in_progress' | 'complete' {
  // 1. 모두 none이면 → none
  if (
    evaluationCriteriaStatus === 'none' &&
    wbsCriteriaStatus === 'none'
  ) {
    return 'none';
  }

  // 2. 모두 complete인지 확인
  const allComplete =
    evaluationCriteriaStatus === 'complete' &&
    wbsCriteriaStatus === 'complete';

  // 3. 모두 complete이면 → complete
  if (allComplete) {
    return 'complete';
  }

  // 4. 하나라도 in_progress나 complete이면 → in_progress
  return 'in_progress';
}

/**
 * 평가기준 설정 통합 상태를 계산한다
 * - 평가기준 설정 진행 상태, 제출 상태, 승인 상태를 통합하여 계산
 * - 1차 평가 제출 승인 상태 통합 로직과 동일한 방식
 * - 평가라인은 제외됨
 * 
 * 계산 로직:
 * 1. 평가기준 설정 진행 상태가 none이면 → none
 * 2. 재작성 요청 관련 상태는 제출 여부와 상관없이 우선 반환:
 *    - 승인 상태가 revision_requested이면 → revision_requested (제출 여부 무관)
 *    - 승인 상태가 revision_completed이면 → revision_completed (제출 여부 무관)
 * 3. 평가기준 설정 진행 상태가 in_progress이면 → in_progress
 * 4. 평가기준 설정 진행 상태가 complete이면:
 *    - 제출되지 않았으면 → in_progress (제출 대기)
 *    - 제출되었고 승인 상태가 pending이면 → pending
 *    - 제출되었고 승인 상태가 approved이면 → approved
 */
export function 평가기준설정_상태를_계산한다(
  evaluationCriteriaStatus: EvaluationCriteriaStatus,
  wbsCriteriaStatus: WbsCriteriaStatus,
  approvalStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed' | null,
  isSubmitted: boolean,
): 'none' | 'in_progress' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed' {
  // 1. 평가기준 설정 진행 상태 계산 (평가라인 제외)
  const progressStatus = 평가기준설정_진행_상태를_계산한다(
    evaluationCriteriaStatus,
    wbsCriteriaStatus,
  );

  // 2. 평가기준 설정 진행 상태가 none이면 → none
  if (progressStatus === 'none') {
    return 'none';
  }

  // 3. 재작성 요청 관련 상태는 제출 여부와 상관없이 우선 반환
  if (approvalStatus === 'revision_requested') {
    return 'revision_requested';
  }
  if (approvalStatus === 'revision_completed') {
    return 'revision_completed';
  }

  // 4. 평가기준 설정 진행 상태가 in_progress이면 → in_progress
  if (progressStatus === 'in_progress') {
    return 'in_progress';
  }

  // 5. 평가기준 설정 진행 상태가 complete이면
  // progressStatus === 'complete'
  // 5-1. 제출되지 않았으면 → in_progress (제출 대기)
  if (!isSubmitted) {
    return 'in_progress';
  }

  // 5-2. 제출되었고 승인 상태 반환 (pending, approved 등)
  return approvalStatus ?? 'pending';
}
