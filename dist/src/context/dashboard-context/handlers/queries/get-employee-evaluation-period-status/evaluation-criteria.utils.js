"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.평가항목_상태를_계산한다 = 평가항목_상태를_계산한다;
exports.WBS평가기준_상태를_계산한다 = WBS평가기준_상태를_계산한다;
exports.평가기준설정_진행_상태를_계산한다 = 평가기준설정_진행_상태를_계산한다;
exports.평가기준설정_상태를_계산한다 = 평가기준설정_상태를_계산한다;
function 평가항목_상태를_계산한다(projectCount, wbsCount) {
    const hasProject = projectCount > 0;
    const hasWbs = wbsCount > 0;
    if (hasProject && hasWbs) {
        return 'complete';
    }
    else if (hasProject || hasWbs) {
        return 'in_progress';
    }
    else {
        return 'none';
    }
}
function WBS평가기준_상태를_계산한다(totalWbsCount, wbsWithCriteriaCount) {
    if (totalWbsCount === 0) {
        return 'none';
    }
    if (wbsWithCriteriaCount === 0) {
        return 'none';
    }
    else if (wbsWithCriteriaCount === totalWbsCount) {
        return 'complete';
    }
    else {
        return 'in_progress';
    }
}
function 평가기준설정_진행_상태를_계산한다(evaluationCriteriaStatus, wbsCriteriaStatus) {
    if (evaluationCriteriaStatus === 'none' &&
        wbsCriteriaStatus === 'none') {
        return 'none';
    }
    const allComplete = evaluationCriteriaStatus === 'complete' &&
        wbsCriteriaStatus === 'complete';
    if (allComplete) {
        return 'complete';
    }
    return 'in_progress';
}
function 평가기준설정_상태를_계산한다(evaluationCriteriaStatus, wbsCriteriaStatus, approvalStatus, isSubmitted) {
    const progressStatus = 평가기준설정_진행_상태를_계산한다(evaluationCriteriaStatus, wbsCriteriaStatus);
    if (progressStatus === 'none') {
        return 'none';
    }
    if (approvalStatus === 'revision_requested') {
        return 'revision_requested';
    }
    if (approvalStatus === 'revision_completed') {
        return 'revision_completed';
    }
    if (progressStatus === 'in_progress') {
        return 'in_progress';
    }
    if (!isSubmitted) {
        return 'in_progress';
    }
    return approvalStatus ?? 'pending';
}
//# sourceMappingURL=evaluation-criteria.utils.js.map