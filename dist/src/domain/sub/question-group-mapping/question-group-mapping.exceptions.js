"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidQuestionGroupMappingReferenceException = exports.DuplicateQuestionGroupMappingException = exports.QuestionGroupMappingNotFoundException = exports.QuestionGroupMappingDomainException = void 0;
class QuestionGroupMappingDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'QuestionGroupMappingDomainException';
    }
}
exports.QuestionGroupMappingDomainException = QuestionGroupMappingDomainException;
class QuestionGroupMappingNotFoundException extends QuestionGroupMappingDomainException {
    constructor(identifier) {
        super(`질문 그룹 매핑을 찾을 수 없습니다: ${identifier}`, 'QUESTION_GROUP_MAPPING_NOT_FOUND', 404, { identifier });
        this.name = 'QuestionGroupMappingNotFoundException';
    }
}
exports.QuestionGroupMappingNotFoundException = QuestionGroupMappingNotFoundException;
class DuplicateQuestionGroupMappingException extends QuestionGroupMappingDomainException {
    constructor(groupId, questionId) {
        super(`이미 존재하는 질문 그룹 매핑입니다: 그룹 ${groupId}, 질문 ${questionId}`, 'DUPLICATE_QUESTION_GROUP_MAPPING', 409, { groupId, questionId });
        this.name = 'DuplicateQuestionGroupMappingException';
    }
}
exports.DuplicateQuestionGroupMappingException = DuplicateQuestionGroupMappingException;
class InvalidQuestionGroupMappingReferenceException extends QuestionGroupMappingDomainException {
    constructor(groupId, questionId) {
        super(`유효하지 않은 참조입니다: 그룹 ${groupId}, 질문 ${questionId}`, 'INVALID_QUESTION_GROUP_MAPPING_REFERENCE', 400, { groupId, questionId });
        this.name = 'InvalidQuestionGroupMappingReferenceException';
    }
}
exports.InvalidQuestionGroupMappingReferenceException = InvalidQuestionGroupMappingReferenceException;
//# sourceMappingURL=question-group-mapping.exceptions.js.map