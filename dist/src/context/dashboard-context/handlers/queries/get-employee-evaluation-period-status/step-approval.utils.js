"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.평가자별_2차평가_단계승인_상태를_조회한다 = 평가자별_2차평가_단계승인_상태를_조회한다;
exports.일차평가_단계승인_상태를_조회한다 = 일차평가_단계승인_상태를_조회한다;
exports.평가자들별_2차평가_단계승인_상태를_조회한다 = 평가자들별_2차평가_단계승인_상태를_조회한다;
exports.자기평가_단계승인_상태를_조회한다 = 자기평가_단계승인_상태를_조회한다;
const typeorm_1 = require("typeorm");
const evaluation_revision_request_1 = require("../../../../../domain/sub/evaluation-revision-request");
async function 평가자별_2차평가_단계승인_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorId, mappingId, revisionRequestRepository, revisionRequestRecipientRepository, secondaryStepApprovalRepository) {
    const secondaryApproval = await secondaryStepApprovalRepository.findOne({
        where: {
            evaluationPeriodEmployeeMappingId: mappingId,
            evaluatorId: evaluatorId,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    if (secondaryApproval) {
        let recipient = null;
        if (secondaryApproval.status === 'revision_requested' ||
            secondaryApproval.status === 'revision_completed') {
            recipient = await revisionRequestRecipientRepository
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
        }
        return {
            evaluatorId,
            status: secondaryApproval.status,
            revisionRequestId: recipient?.revisionRequest?.id ?? secondaryApproval.revisionRequestId,
            revisionComment: recipient?.revisionRequest?.comment ?? null,
            isCompleted: recipient?.isCompleted ?? false,
            completedAt: recipient?.completedAt ?? null,
            responseComment: recipient?.responseComment ?? null,
            requestedAt: recipient?.revisionRequest?.requestedAt ?? null,
            approvedBy: secondaryApproval.approvedBy,
            approvedAt: secondaryApproval.approvedAt,
        };
    }
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
    if (recipient && recipient.revisionRequest) {
        const request = recipient.revisionRequest;
        const status = recipient.isCompleted
            ? 'revision_completed'
            : 'revision_requested';
        return {
            evaluatorId,
            status,
            revisionRequestId: request.id,
            revisionComment: request.comment,
            isCompleted: recipient.isCompleted,
            completedAt: recipient.completedAt,
            responseComment: recipient.responseComment,
            requestedAt: request.requestedAt,
            approvedBy: null,
            approvedAt: null,
        };
    }
    return {
        evaluatorId,
        status: 'pending',
        revisionRequestId: null,
        revisionComment: null,
        isCompleted: false,
        completedAt: null,
        responseComment: null,
        requestedAt: null,
        approvedBy: null,
        approvedAt: null,
    };
}
async function 일차평가_단계승인_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorId, revisionRequestRepository, revisionRequestRecipientRepository) {
    const recipient = await revisionRequestRecipientRepository
        .createQueryBuilder('recipient')
        .leftJoinAndSelect('recipient.revisionRequest', 'request')
        .where('request.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
    })
        .andWhere('request.employeeId = :employeeId', { employeeId })
        .andWhere('request.step = :step', { step: 'primary' })
        .andWhere('recipient.recipientId = :evaluatorId', { evaluatorId })
        .andWhere('recipient.recipientType = :recipientType', {
        recipientType: evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR,
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
            approvedBy: null,
            approvedAt: null,
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
        approvedBy: null,
        approvedAt: null,
    };
}
async function 평가자들별_2차평가_단계승인_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorIds, mappingId, revisionRequestRepository, revisionRequestRecipientRepository, secondaryStepApprovalRepository) {
    if (evaluatorIds.length === 0) {
        return [];
    }
    const statuses = await Promise.all(evaluatorIds.map((evaluatorId) => 평가자별_2차평가_단계승인_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorId, mappingId, revisionRequestRepository, revisionRequestRecipientRepository, secondaryStepApprovalRepository)));
    return statuses;
}
async function 자기평가_단계승인_상태를_조회한다(evaluationPeriodId, employeeId, revisionRequestRepository, revisionRequestRecipientRepository) {
    const recipient = await revisionRequestRecipientRepository
        .createQueryBuilder('recipient')
        .leftJoinAndSelect('recipient.revisionRequest', 'request')
        .where('request.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
    })
        .andWhere('request.employeeId = :employeeId', { employeeId })
        .andWhere('request.step = :step', { step: 'self' })
        .andWhere('recipient.recipientId = :employeeId', { employeeId })
        .andWhere('recipient.recipientType = :recipientType', {
        recipientType: evaluation_revision_request_1.RecipientType.EVALUATEE,
    })
        .andWhere('recipient.deletedAt IS NULL')
        .andWhere('request.deletedAt IS NULL')
        .orderBy('request.requestedAt', 'DESC')
        .getOne();
    if (!recipient || !recipient.revisionRequest) {
        return {
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
        status,
        revisionRequestId: request.id,
        revisionComment: request.comment,
        isCompleted: recipient.isCompleted,
        completedAt: recipient.completedAt,
        responseComment: recipient.responseComment,
        requestedAt: request.requestedAt,
    };
}
//# sourceMappingURL=step-approval.utils.js.map