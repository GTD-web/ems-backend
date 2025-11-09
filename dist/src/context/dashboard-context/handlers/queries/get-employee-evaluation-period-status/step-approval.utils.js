"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.평가자별_2차평가_단계승인_상태를_조회한다 = 평가자별_2차평가_단계승인_상태를_조회한다;
exports.평가자들별_2차평가_단계승인_상태를_조회한다 = 평가자들별_2차평가_단계승인_상태를_조회한다;
const evaluation_revision_request_1 = require("../../../../../domain/sub/evaluation-revision-request");
async function 평가자별_2차평가_단계승인_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorId, revisionRequestRepository, revisionRequestRecipientRepository) {
    const recipient = await revisionRequestRecipientRepository
        .createQueryBuilder('recipient')
        .leftJoinAndSelect('recipient.revisionRequest', 'request')
        .where('request.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
    })
        .andWhere('request.employeeId = :employeeId', { employeeId })
        .andWhere('request.step = :step', { step: 'secondary' })
        .andWhere('recipient.recipientId = :evaluatorId', { evaluatorId })
        .andWhere('recipient.recipientType = :recipientType', {
        recipientType: evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR,
    })
        .andWhere('recipient.deletedAt IS NULL')
        .andWhere('request.deletedAt IS NULL')
        .orderBy('request.requestedAt', 'DESC')
        .getOne();
    if (!recipient || !recipient.revisionRequest) {
        return {
            evaluatorId,
            status: 'pending',
            revisionRequestId: null,
            revisionComment: null,
            isCompleted: false,
            completedAt: null,
            responseComment: null,
            requestedAt: null,
        };
    }
    const request = recipient.revisionRequest;
    let status;
    if (recipient.isCompleted) {
        status = 'revision_completed';
    }
    else {
        status = 'revision_requested';
    }
    return {
        evaluatorId,
        status,
        revisionRequestId: request.id,
        revisionComment: request.comment,
        isCompleted: recipient.isCompleted,
        completedAt: recipient.completedAt,
        responseComment: recipient.responseComment,
        requestedAt: request.requestedAt,
    };
}
async function 평가자들별_2차평가_단계승인_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorIds, revisionRequestRepository, revisionRequestRecipientRepository) {
    if (evaluatorIds.length === 0) {
        return [];
    }
    const statuses = await Promise.all(evaluatorIds.map((evaluatorId) => 평가자별_2차평가_단계승인_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorId, revisionRequestRepository, revisionRequestRecipientRepository)));
    return statuses;
}
//# sourceMappingURL=step-approval.utils.js.map