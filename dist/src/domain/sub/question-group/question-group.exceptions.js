"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyGroupNameException = exports.GroupWithQuestionsException = exports.UndeletableGroupException = exports.DefaultGroupDeletionException = exports.DuplicateQuestionGroupException = exports.QuestionGroupNotFoundException = exports.QuestionGroupDomainException = void 0;
class QuestionGroupDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'QuestionGroupDomainException';
    }
}
exports.QuestionGroupDomainException = QuestionGroupDomainException;
class QuestionGroupNotFoundException extends QuestionGroupDomainException {
    constructor(identifier) {
        super(`질문 그룹을 찾을 수 없습니다: ${identifier}`, 'QUESTION_GROUP_NOT_FOUND', 404, { identifier });
        this.name = 'QuestionGroupNotFoundException';
    }
}
exports.QuestionGroupNotFoundException = QuestionGroupNotFoundException;
class DuplicateQuestionGroupException extends QuestionGroupDomainException {
    constructor(name) {
        super(`이미 존재하는 질문 그룹입니다: ${name}`, 'DUPLICATE_QUESTION_GROUP', 409, { name });
        this.name = 'DuplicateQuestionGroupException';
    }
}
exports.DuplicateQuestionGroupException = DuplicateQuestionGroupException;
class DefaultGroupDeletionException extends QuestionGroupDomainException {
    constructor(groupId) {
        super(`기본 그룹은 삭제할 수 없습니다: ${groupId}`, 'DEFAULT_GROUP_DELETION_NOT_ALLOWED', 403, { groupId });
        this.name = 'DefaultGroupDeletionException';
    }
}
exports.DefaultGroupDeletionException = DefaultGroupDeletionException;
class UndeletableGroupException extends QuestionGroupDomainException {
    constructor(groupId) {
        super(`삭제할 수 없는 그룹입니다: ${groupId}`, 'GROUP_DELETION_NOT_ALLOWED', 403, { groupId });
        this.name = 'UndeletableGroupException';
    }
}
exports.UndeletableGroupException = UndeletableGroupException;
class GroupWithQuestionsException extends QuestionGroupDomainException {
    constructor(groupId, questionCount) {
        super(`질문이 있는 그룹은 삭제할 수 없습니다: ${groupId} (질문 수: ${questionCount})`, 'GROUP_HAS_QUESTIONS', 409, { groupId, questionCount });
        this.name = 'GroupWithQuestionsException';
    }
}
exports.GroupWithQuestionsException = GroupWithQuestionsException;
class EmptyGroupNameException extends QuestionGroupDomainException {
    constructor() {
        super('그룹명은 비어있을 수 없습니다', 'EMPTY_GROUP_NAME', 400);
        this.name = 'EmptyGroupNameException';
    }
}
exports.EmptyGroupNameException = EmptyGroupNameException;
//# sourceMappingURL=question-group.exceptions.js.map