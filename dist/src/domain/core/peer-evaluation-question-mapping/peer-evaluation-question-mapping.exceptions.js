"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicatePeerEvaluationQuestionMappingException = exports.PeerEvaluationQuestionMappingNotFoundException = exports.PeerEvaluationQuestionMappingDomainException = void 0;
const common_1 = require("@nestjs/common");
class PeerEvaluationQuestionMappingDomainException extends common_1.BadRequestException {
    constructor(message, code, statusCode = 400, data) {
        super({
            message,
            code,
            statusCode,
            data,
        });
        this.name = 'PeerEvaluationQuestionMappingDomainException';
    }
}
exports.PeerEvaluationQuestionMappingDomainException = PeerEvaluationQuestionMappingDomainException;
class PeerEvaluationQuestionMappingNotFoundException extends common_1.NotFoundException {
    constructor(mappingId) {
        super(`동료평가 질문 매핑을 찾을 수 없습니다. (id: ${mappingId})`, 'PEER_EVALUATION_QUESTION_MAPPING_NOT_FOUND');
        this.name = 'PeerEvaluationQuestionMappingNotFoundException';
    }
}
exports.PeerEvaluationQuestionMappingNotFoundException = PeerEvaluationQuestionMappingNotFoundException;
class DuplicatePeerEvaluationQuestionMappingException extends common_1.ConflictException {
    constructor(peerEvaluationId, questionId) {
        super(`이미 해당 동료평가에 질문이 추가되어 있습니다. (peerEvaluationId: ${peerEvaluationId}, questionId: ${questionId})`, 'DUPLICATE_PEER_EVALUATION_QUESTION_MAPPING');
        this.name = 'DuplicatePeerEvaluationQuestionMappingException';
    }
}
exports.DuplicatePeerEvaluationQuestionMappingException = DuplicatePeerEvaluationQuestionMappingException;
//# sourceMappingURL=peer-evaluation-question-mapping.exceptions.js.map