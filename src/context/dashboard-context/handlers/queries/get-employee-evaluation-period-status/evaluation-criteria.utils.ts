import {
  EvaluationCriteriaStatus,
  WbsCriteriaStatus,
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
