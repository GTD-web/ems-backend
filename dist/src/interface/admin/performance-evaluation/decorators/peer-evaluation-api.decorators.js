"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestPeerEvaluation = RequestPeerEvaluation;
exports.RequestPeerEvaluationToMultipleEvaluators = RequestPeerEvaluationToMultipleEvaluators;
exports.RequestMultiplePeerEvaluations = RequestMultiplePeerEvaluations;
exports.RequestPartLeaderPeerEvaluations = RequestPartLeaderPeerEvaluations;
exports.UpdatePeerEvaluation = UpdatePeerEvaluation;
exports.SubmitPeerEvaluation = SubmitPeerEvaluation;
exports.GetPeerEvaluations = GetPeerEvaluations;
exports.GetEvaluatorPeerEvaluations = GetEvaluatorPeerEvaluations;
exports.GetEvaluateePeerEvaluations = GetEvaluateePeerEvaluations;
exports.GetAllPeerEvaluations = GetAllPeerEvaluations;
exports.GetPeerEvaluationDetail = GetPeerEvaluationDetail;
exports.GetEvaluatorAssignedEvaluatees = GetEvaluatorAssignedEvaluatees;
exports.CancelPeerEvaluation = CancelPeerEvaluation;
exports.CancelPeerEvaluationsByPeriod = CancelPeerEvaluationsByPeriod;
exports.UpsertPeerEvaluationAnswers = UpsertPeerEvaluationAnswers;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const peer_evaluation_dto_1 = require("../dto/peer-evaluation.dto");
function RequestPeerEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('requests'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '동료평가 요청(할당)',
        description: `관리자가 평가자에게 피평가자를 평가하도록 요청(할당)합니다.

**동작:**
- 평가자에게 피평가자를 평가하도록 할당
- 평가 상태는 PENDING으로 생성됨
- questionIds 제공 시 해당 질문들에 대해 작성 요청 (질문 매핑 자동 생성)
- questionIds 생략 시 질문 없이 요청만 생성
- 평가자는 할당된 목록을 조회하여 평가 작성 가능

**테스트 케이스:**
- 기본 동료평가 요청을 생성할 수 있어야 한다
- 요청 마감일을 포함하여 동료평가 요청을 생성할 수 있어야 한다
- 질문 ID 목록을 포함하여 동료평가 요청을 생성할 수 있어야 한다
- requestedBy를 포함하여 동료평가 요청을 생성할 수 있어야 한다
- requestedBy 없이 동료평가 요청을 생성할 수 있어야 한다
- 동일한 평가자가 여러 피평가자에게 평가 요청을 받을 수 있어야 한다
- 한 피평가자를 여러 평가자가 평가하도록 요청할 수 있어야 한다
- 잘못된 형식의 evaluatorId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다
- evaluatorId 누락 시 400 에러가 발생해야 한다
- evaluateeId 누락 시 400 에러가 발생해야 한다
- periodId 누락 시 400 에러가 발생해야 한다
- 잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 evaluatorId로 요청 시 404 에러가 발생해야 한다
- 존재하지 않는 evaluateeId로 요청 시 404 에러가 발생해야 한다
- 존재하지 않는 periodId로 요청 시 404 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 응답의 ID가 유효한 UUID 형식이어야 한다
- 생성된 동료평가가 DB에 올바르게 저장되어야 한다
- 생성된 동료평가의 상태가 올바르게 설정되어야 한다
- 생성 시 createdAt과 updatedAt이 설정되어야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: peer_evaluation_dto_1.RequestPeerEvaluationDto,
        description: '동료평가 요청 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '동료평가가 성공적으로 요청되었습니다.',
        type: peer_evaluation_dto_1.PeerEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 동일한 동료평가 요청이 존재합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가자, 피평가자 또는 평가기간을 찾을 수 없습니다.',
    }));
}
function RequestPeerEvaluationToMultipleEvaluators() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('requests/bulk/one-evaluatee-to-many-evaluators'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '한 명의 피평가자를 여러 평가자에게 요청',
        description: `한 명의 피평가자를 여러 평가자가 평가하도록 일괄 요청합니다.

**동작:**
- 여러 평가자에게 동일한 피평가자에 대한 평가 요청 생성
- 모든 평가 상태는 PENDING으로 생성됨
- questionIds 제공 시 모든 평가자에게 동일한 질문들에 대해 작성 요청
- questionIds 생략 시 질문 없이 요청만 생성
- 각 평가자는 자신에게 할당된 평가를 조회 가능

**테스트 케이스:**
- 기본 일괄 요청을 생성할 수 있어야 한다
- 요청 마감일을 포함하여 일괄 요청을 생성할 수 있어야 한다
- 질문 ID 목록을 포함하여 일괄 요청을 생성할 수 있어야 한다
- requestedBy를 포함하여 일괄 요청을 생성할 수 있어야 한다
- requestedBy 없이 일괄 요청을 생성할 수 있어야 한다
- 단일 평가자에게 요청할 수 있어야 한다
- 많은 평가자에게 동시에 요청할 수 있어야 한다
- 잘못된 형식의 evaluatorIds로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다
- 빈 evaluatorIds 배열로 요청 시 400 에러가 발생해야 한다
- evaluatorIds 누락 시 400 에러가 발생해야 한다
- evaluateeId 누락 시 400 에러가 발생해야 한다
- periodId 누락 시 400 에러가 발생해야 한다
- 잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 evaluatorId 포함 시 해당 평가자는 건너뛰고 나머지만 생성해야 한다
- 존재하지 않는 evaluateeId로 요청 시 404 에러가 발생해야 한다
- 존재하지 않는 periodId로 요청 시 아무것도 생성되지 않아야 한다
- 응답에 필수 필드가 모두 포함되어야 한다 (results, summary, message)
- 응답의 results에 각 요청 결과가 포함되어야 한다 (성공/실패 상태, 에러 정보 등)
- 응답의 summary에 요약 정보가 포함되어야 한다 (total, success, failed)
- 응답의 IDs가 모두 유효한 UUID 형식이어야 한다
- 응답의 count가 생성된 평가 개수와 일치해야 한다
- 생성된 모든 동료평가가 DB에 올바르게 저장되어야 한다
- 생성된 모든 동료평가의 상태가 올바르게 설정되어야 한다
- 생성 시 모든 평가에 createdAt과 updatedAt이 설정되어야 한다
- 평가자 목록에 피평가자 자신이 포함된 경우 제외되어야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: peer_evaluation_dto_1.RequestPeerEvaluationToMultipleEvaluatorsDto,
        description: '일괄 동료평가 요청 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '동료평가 요청들이 성공적으로 생성되었습니다.',
        type: peer_evaluation_dto_1.BulkPeerEvaluationRequestResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가자, 피평가자 또는 평가기간을 찾을 수 없습니다.',
    }));
}
function RequestMultiplePeerEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('requests/bulk/one-evaluator-to-many-evaluatees'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '한 명의 평가자가 여러 피평가자를 평가하도록 요청',
        description: `한 명의 평가자가 여러 피평가자를 평가하도록 일괄 요청합니다.

**동작:**
- 한 명의 평가자에게 여러 피평가자에 대한 평가 요청 생성
- 모든 평가 상태는 PENDING으로 생성됨
- questionIds 제공 시 모든 피평가자에 대해 동일한 질문들에 대해 작성 요청
- questionIds 생략 시 질문 없이 요청만 생성
- 평가자는 자신에게 할당된 모든 평가를 조회 가능

**테스트 케이스:**
- 기본 일괄 요청을 생성할 수 있어야 한다
- 요청 마감일을 포함하여 일괄 요청을 생성할 수 있어야 한다
- 질문 ID 목록을 포함하여 일괄 요청을 생성할 수 있어야 한다
- requestedBy를 포함하여 일괄 요청을 생성할 수 있어야 한다
- requestedBy 없이 일괄 요청을 생성할 수 있어야 한다
- 단일 피평가자에게 요청할 수 있어야 한다
- 많은 피평가자에게 동시에 요청할 수 있어야 한다
- 잘못된 형식의 evaluatorId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 evaluateeIds로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다
- 빈 evaluateeIds 배열로 요청 시 400 에러가 발생해야 한다
- evaluatorId 누락 시 400 에러가 발생해야 한다
- evaluateeIds 누락 시 400 에러가 발생해야 한다
- periodId 누락 시 400 에러가 발생해야 한다
- 잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 evaluatorId로 요청 시 아무것도 생성되지 않아야 한다
- 존재하지 않는 evaluateeId 포함 시 해당 피평가자는 건너뛰고 나머지만 생성해야 한다
- 존재하지 않는 periodId로 요청 시 아무것도 생성되지 않아야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 응답의 IDs가 모두 유효한 UUID 형식이어야 한다
- 응답의 count가 생성된 평가 개수와 일치해야 한다
- 생성된 모든 동료평가가 DB에 올바르게 저장되어야 한다
- 생성된 모든 동료평가의 상태가 올바르게 설정되어야 한다
- 생성 시 모든 평가에 createdAt과 updatedAt이 설정되어야 한다
- 피평가자 목록에 평가자 자신이 포함된 경우 제외되어야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: peer_evaluation_dto_1.RequestMultiplePeerEvaluationsDto,
        description: '일괄 동료평가 요청 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '동료평가 요청들이 성공적으로 생성되었습니다.',
        type: peer_evaluation_dto_1.BulkPeerEvaluationRequestResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가자, 피평가자 또는 평가기간을 찾을 수 없습니다.',
    }));
}
function RequestPartLeaderPeerEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('requests/bulk/part-leaders'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '파트장들 간 동료평가 요청',
        description: `파트장들 간 동료평가를 요청합니다. evaluatorIds와 evaluateeIds를 지정하여 특정 파트장들만 평가하도록 설정할 수 있습니다.

**동작:**
- evaluatorIds 미제공 시: SSO에서 모든 파트장을 평가자로 설정
- evaluateeIds 미제공 시: SSO에서 모든 파트장을 피평가자로 설정
- evaluatorIds 제공 시: 지정된 파트장들만 평가자로 설정
- evaluateeIds 제공 시: 지정된 파트장들만 피평가자로 설정
- 각 평가자가 자기 자신을 제외한 모든 피평가자를 평가하도록 요청 생성
- 모든 평가 상태는 PENDING으로 생성됨
- questionIds 제공 시 모든 평가자에게 동일한 질문들에 대해 작성 요청
- questionIds 생략 시 "파트장 평가 질문" 그룹의 질문들을 자동으로 사용 (그룹이 없으면 질문 없이 생성)

**사용 예시:**
1. 모든 파트장 간 평가: evaluatorIds, evaluateeIds 생략
2. 특정 파트장들만 평가자로: evaluatorIds 지정, evaluateeIds 생략
3. 특정 파트장들만 피평가자로: evaluatorIds 생략, evaluateeIds 지정
4. 특정 파트장들끼리만 평가: evaluatorIds, evaluateeIds 모두 지정

**테스트 케이스:**
- 기본 파트장 간 동료평가 요청을 생성할 수 있어야 한다
- 특정 평가자들만 지정하여 요청을 생성할 수 있어야 한다
- 특정 피평가자들만 지정하여 요청을 생성할 수 있어야 한다
- 평가자와 피평가자를 모두 지정하여 요청을 생성할 수 있어야 한다
- 요청 마감일을 포함하여 요청을 생성할 수 있어야 한다
- 질문 ID 목록을 포함하여 요청을 생성할 수 있어야 한다
- requestedBy를 포함하여 요청을 생성할 수 있어야 한다
- requestedBy 없이 요청을 생성할 수 있어야 한다
- 파트장이 1명인 경우 평가 요청이 생성되지 않아야 한다
- 파트장이 2명인 경우 2개의 평가 요청이 생성되어야 한다
- 파트장이 N명인 경우 N * (N-1)개의 평가 요청이 생성되어야 한다
- 각 파트장이 자기 자신을 평가하는 요청은 생성되지 않아야 한다
- 잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다
- periodId 누락 시 400 에러가 발생해야 한다
- 잘못된 형식의 evaluatorIds로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 evaluateeIds로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 periodId로 요청 시 404 에러가 발생해야 한다
- 파트장이 한 명도 없는 경우 0개의 평가 요청이 생성되어야 한다
- 응답에 필수 필드가 모두 포함되어야 한다 (results, summary, message)
- 응답의 results에 각 요청 결과가 포함되어야 한다
- 응답의 summary에 요약 정보가 포함되어야 한다 (total, success, failed, partLeaderCount)
- 응답의 partLeaderCount가 실제 파트장 수와 일치해야 한다
- 응답의 IDs가 모두 유효한 UUID 형식이어야 한다
- 생성된 모든 동료평가가 DB에 올바르게 저장되어야 한다
- 생성된 모든 동료평가의 상태가 올바르게 설정되어야 한다
- 생성 시 모든 평가에 createdAt과 updatedAt이 설정되어야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: peer_evaluation_dto_1.RequestPartLeaderPeerEvaluationsDto,
        description: '파트장 간 동료평가 요청 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '파트장들 간 동료평가 요청이 성공적으로 생성되었습니다.',
        type: peer_evaluation_dto_1.BulkPeerEvaluationRequestResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가기간을 찾을 수 없습니다.',
    }));
}
function UpdatePeerEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Put)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '동료평가 수정',
        description: '기존 동료평가를 수정합니다.',
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '동료평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiBody)({
        type: peer_evaluation_dto_1.UpdatePeerEvaluationDto,
        description: '동료평가 수정 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '동료평가가 성공적으로 수정되었습니다.',
        type: peer_evaluation_dto_1.PeerEvaluationBasicDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '동료평가를 찾을 수 없습니다.',
    }));
}
function SubmitPeerEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(':id/submit'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '동료평가 제출',
        description: `동료평가를 제출합니다.

**동작:**
- 동료평가를 완료 상태로 변경
- 평가에 매핑된 모든 질문에 대한 응답이 있어야 제출 가능
- 제출 후 isCompleted가 true로 설정됨
- 제출 후 completedAt에 제출 시각이 기록됨

**테스트 케이스:**
- 기본 동료평가 제출을 할 수 있어야 한다
- submittedBy를 포함하여 동료평가 제출을 할 수 있어야 한다
- submittedBy 없이 동료평가 제출을 할 수 있어야 한다
- 잘못된 형식의 평가 ID로 제출 시 400 에러가 발생해야 한다
- 존재하지 않는 평가 ID로 제출 시 400 에러가 발생해야 한다
- 이미 제출된 평가를 다시 제출 시 400 에러가 발생해야 한다
- 잘못된 형식의 submittedBy로 제출 시 400 에러가 발생해야 한다
- 응답 없이 평가 제출 시 400 에러가 발생해야 한다
- 질문이 없는 평가를 제출 시 400 에러가 발생해야 한다
- 제출 성공 시 200 상태 코드를 반환해야 한다
- 제출 후 isCompleted가 true로 변경되어야 한다
- 제출 후 status가 적절히 변경되어야 한다
- 제출 시 completedAt이 설정되어야 한다
- 제출 시 updatedAt이 갱신되어야 한다
- 제출된 평가의 모든 필수 정보가 유지되어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '동료평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '동료평가가 성공적으로 제출되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '동료평가를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 제출된 동료평가입니다.',
    }));
}
function GetPeerEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '동료평가 목록 조회',
        description: `동료평가 목록을 상세 정보와 함께 페이지네이션 형태로 조회합니다.

**동작:**
- 평가자, 피평가자, 평가기간, 상태 등 다양한 필터 조건 지원
- evaluatorId와 evaluateeId를 모두 제공하면 해당 조건에 맞는 평가만 조회
- 하나만 제공하면 해당 기준으로 필터링
- 모두 제공하지 않으면 전체 동료평가 목록 조회
- 페이지네이션 지원 (기본값: page=1, limit=10)
- 상세 정보 포함 (평가기간, 평가자, 피평가자, 부서, 매핑자, 질문 목록)

**응답 구조:**
- evaluations: 평가 상세 목록 배열 (상세 조회와 동일한 구조)
- page: 현재 페이지 번호
- limit: 페이지당 항목 수
- total: 전체 항목 수

**테스트 케이스:**
- 전체 목록 조회: evaluatorId와 evaluateeId 없이 모든 동료평가 목록 조회
- 평가자 기준 필터링: evaluatorId로 특정 평가자의 동료평가 목록 조회
- 피평가자 기준 필터링: evaluateeId로 특정 피평가자의 동료평가 목록 조회
- 복합 필터링: evaluatorId와 evaluateeId를 함께 사용하여 필터링
- periodId 필터링: 평가기간으로 필터링
- status 필터링: 평가 상태로 필터링
- 페이지네이션 작동: page와 limit 파라미터로 페이지네이션 지원
- 응답 구조 검증: 모든 필수 필드가 포함되어야 함
- 상세 정보 포함: 평가기간, 평가자, 피평가자, 부서, 매핑자, 질문 목록 포함
- UUID 형식 검증: 모든 UUID 필드가 유효한 형식이어야 함`,
    }), (0, swagger_1.ApiQuery)({
        name: 'evaluatorId',
        description: '평가자 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiQuery)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiQuery)({
        name: 'periodId',
        description: '평가기간 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiQuery)({
        name: 'status',
        description: '평가 상태',
        required: false,
        enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
        example: 'DRAFT',
    }), (0, swagger_1.ApiQuery)({
        name: 'page',
        description: '페이지 번호 (1부터 시작)',
        required: false,
        example: 1,
    }), (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: '페이지 크기',
        required: false,
        example: 10,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '동료평가 목록이 성공적으로 조회되었습니다.',
        type: peer_evaluation_dto_1.PeerEvaluationListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }));
}
function GetEvaluatorPeerEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('evaluator/:evaluatorId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가자의 동료평가 목록 조회',
        deprecated: true,
        description: `특정 평가자의 동료평가 목록을 상세 정보와 함께 페이지네이션 형태로 조회합니다.

**⚠️ Deprecated**: 이 엔드포인트는 사용 중단 예정입니다. 대신 \`GET /?evaluatorId={evaluatorId}\`를 사용하세요.

**동작:**
- 평가자에게 할당된 모든 동료평가 목록 조회
- 다양한 필터 조건 지원 (피평가자, 평가기간, 상태)
- 페이지네이션 지원 (기본값: page=1, limit=10)
- 상세 정보 포함 (평가기간, 평가자, 피평가자, 부서, 매핑자, 질문 목록)

**응답 구조:**
- evaluations: 평가 상세 목록 배열 (상세 조회와 동일한 구조)
- page: 현재 페이지 번호
- limit: 페이지당 항목 수
- total: 전체 항목 수

**테스트 케이스:**
- 기본 목록을 조회할 수 있어야 한다
- 여러 개의 평가 목록을 조회할 수 있어야 한다
- evaluateeId로 필터링할 수 있어야 한다
- periodId로 필터링할 수 있어야 한다
- 페이지네이션이 작동해야 한다
- 평가가 없는 평가자의 경우 빈 배열을 반환해야 한다
- 잘못된 형식의 evaluatorId로 조회 시 400 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 평가 항목에 필수 필드가 포함되어야 한다
- UUID 필드가 유효한 UUID 형식이어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluatorId',
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiQuery)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiQuery)({
        name: 'periodId',
        description: '평가기간 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiQuery)({
        name: 'status',
        description: '평가 상태',
        required: false,
        enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
        example: 'DRAFT',
    }), (0, swagger_1.ApiQuery)({
        name: 'page',
        description: '페이지 번호 (1부터 시작)',
        required: false,
        example: 1,
    }), (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: '페이지 크기',
        required: false,
        example: 10,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '평가자의 동료평가 목록이 성공적으로 조회되었습니다.',
        type: peer_evaluation_dto_1.PeerEvaluationListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가자를 찾을 수 없습니다.',
    }));
}
function GetEvaluateePeerEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('evaluatee/:evaluateeId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '피평가자의 동료평가 목록 조회',
        deprecated: true,
        description: `특정 피평가자의 동료평가 목록을 상세 정보와 함께 페이지네이션 형태로 조회합니다.

**⚠️ Deprecated**: 이 엔드포인트는 사용 중단 예정입니다. 대신 \`GET /?evaluateeId={evaluateeId}\`를 사용하세요.

**동작:**
- 피평가자에게 할당된 모든 동료평가 목록 조회
- 다양한 필터 조건 지원 (평가자, 평가기간, 상태)
- 페이지네이션 지원 (기본값: page=1, limit=10)
- 상세 정보 포함 (평가기간, 평가자, 피평가자, 부서, 매핑자, 질문 목록)

**응답 구조:**
- evaluations: 평가 상세 목록 배열 (상세 조회와 동일한 구조)
- page: 현재 페이지 번호
- limit: 페이지당 항목 수
- total: 전체 항목 수

**테스트 케이스:**
- 기본 목록을 조회할 수 있어야 한다
- 여러 개의 평가 목록을 조회할 수 있어야 한다
- evaluatorId로 필터링할 수 있어야 한다
- periodId로 필터링할 수 있어야 한다
- status로 필터링할 수 있어야 한다
- 페이지네이션이 작동해야 한다
- 평가가 없는 피평가자의 경우 빈 배열을 반환해야 한다
- 잘못된 형식의 evaluateeId로 조회 시 400 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 평가 항목에 필수 필드가 포함되어야 한다
- UUID 필드가 유효한 UUID 형식이어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiQuery)({
        name: 'evaluatorId',
        description: '평가자 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiQuery)({
        name: 'periodId',
        description: '평가기간 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiQuery)({
        name: 'status',
        description: '평가 상태',
        required: false,
        enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
        example: 'DRAFT',
    }), (0, swagger_1.ApiQuery)({
        name: 'page',
        description: '페이지 번호 (1부터 시작)',
        required: false,
        example: 1,
    }), (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: '페이지 크기',
        required: false,
        example: 10,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '피평가자의 동료평가 목록이 성공적으로 조회되었습니다.',
        type: peer_evaluation_dto_1.PeerEvaluationListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '피평가자를 찾을 수 없습니다.',
    }));
}
function GetAllPeerEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('evaluator'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '모든 평가자의 동료평가 상세 목록 조회',
        deprecated: true,
        description: `모든 평가자의 동료평가 목록을 상세 정보와 함께 페이지네이션 형태로 조회합니다.

**⚠️ Deprecated**: 이 엔드포인트는 사용 중단 예정입니다. 대신 \`GET /\`를 사용하세요.

**동작:**
- 모든 평가자의 동료평가 목록 조회
- 다양한 필터 조건 지원 (피평가자, 평가기간, 상태)
- 페이지네이션 지원 (기본값: page=1, limit=10)
- 상세 정보 포함 (평가기간, 평가자, 피평가자, 부서, 매핑자, 질문 목록)

**응답 구조:**
- evaluations: 평가 상세 목록 배열 (상세 조회와 동일한 구조)
- page: 현재 페이지 번호
- limit: 페이지당 항목 수
- total: 전체 항목 수

**테스트 케이스:**
- evaluatorId 없이 모든 평가자의 목록을 조회할 수 있어야 한다
- evaluateeId로 필터링할 수 있어야 한다
- periodId로 필터링할 수 있어야 한다
- 페이지네이션이 작동해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 평가 항목에 필수 필드가 포함되어야 한다
- UUID 필드가 유효한 UUID 형식이어야 한다`,
    }), (0, swagger_1.ApiQuery)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiQuery)({
        name: 'periodId',
        description: '평가기간 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiQuery)({
        name: 'status',
        description: '평가 상태',
        required: false,
        enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
        example: 'DRAFT',
    }), (0, swagger_1.ApiQuery)({
        name: 'page',
        description: '페이지 번호 (1부터 시작)',
        required: false,
        example: 1,
    }), (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: '페이지 크기',
        required: false,
        example: 10,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '모든 평가자의 동료평가 목록이 성공적으로 조회되었습니다.',
        type: peer_evaluation_dto_1.PeerEvaluationListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }));
}
function GetPeerEvaluationDetail() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '동료평가 상세정보 조회',
        description: `동료평가의 상세정보를 조회합니다.

**동작:**
- 동료평가의 모든 필드 정보 조회
- 평가기간 정보를 객체로 포함 (id, name, startDate, endDate, status)
- 평가자와 피평가자의 직원 정보를 객체로 포함
- 평가자와 피평가자의 부서 정보를 객체로 포함
- 매핑자의 직원 정보를 객체로 포함
- 평가 상태 및 완료 여부 정보 포함
- 할당된 평가질문 목록 포함 (표시 순서대로 정렬)
- ID 중복 제거: 객체로 제공되는 정보의 ID는 별도 필드로 제공하지 않음

**테스트 케이스:**
- 기본 조회: 평가 ID로 동료평가 상세 정보를 조회할 수 있음
- 모든 필드 조회: 생성된 동료평가의 모든 필드가 조회됨
- 직원 정보 포함: 평가자와 피평가자의 정보가 응답에 포함됨
- 부서 정보 포함: 평가자와 피평가자의 부서 정보가 응답에 포함됨
- 잘못된 UUID 형식: 잘못된 형식의 평가 ID로 조회 시 400 에러
- 존재하지 않는 평가: 존재하지 않는 평가 ID로 조회 시 404 에러
- 필수 필드 검증: 응답에 필수 필드가 모두 포함됨
- UUID 형식 검증: UUID 필드가 유효한 UUID 형식임
- 날짜 형식 검증: 날짜 필드가 유효한 날짜 형식임
- DB 데이터 일치: 조회된 데이터가 DB의 실제 데이터와 일치함
- 초기 상태 검증: 생성 시 isCompleted가 false임
- 대기 상태 검증: 생성 시 status가 pending임`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '동료평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '동료평가 상세정보가 성공적으로 조회되었습니다. 평가자와 피평가자의 직원 정보 및 부서 정보를 포함합니다.',
        type: peer_evaluation_dto_1.PeerEvaluationDetailResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '동료평가를 찾을 수 없습니다.',
    }));
}
function GetEvaluatorAssignedEvaluatees() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('evaluator/:evaluatorId/assigned-evaluatees'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가자에게 할당된 피평가자 목록 조회',
        description: `평가자가 평가해야 하는 피평가자 상세 목록을 배열 형태로 조회합니다.

**동작:**
- 평가자에게 할당된 모든 피평가자 목록 조회
- 피평가자 직원 정보 및 부서 정보 포함
- 평가 진행 상태 정보 포함 (status, isCompleted, completedAt)
- 요청 마감일 정보 포함 (requestDeadline)
- 요청자(mappedBy) 정보 포함 (동료평가를 요청한 관리자 정보)
- 기본적으로 완료되지 않은 평가만 조회 (includeCompleted=false)
- periodId로 특정 평가기간 필터링 가능

**응답 구조:**
- 배열 형태의 직접 반환 (페이지네이션 없음)
- 각 항목에 평가 정보 + 피평가자 정보 + 부서 정보 + 요청자 정보 포함

**정렬 기준:**
- 미완료 평가 우선
- 매핑일 최신순

**테스트 케이스:**
- 기본 목록을 조회할 수 있어야 한다
- 여러 명의 피평가자를 조회할 수 있어야 한다
- periodId로 필터링할 수 있어야 한다
- 완료된 평가를 제외할 수 있어야 한다 (기본 동작)
- 완료된 평가를 포함할 수 있어야 한다
- 평가가 없는 평가자의 경우 빈 배열을 반환해야 한다
- 잘못된 형식의 evaluatorId로 조회 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 조회 시 400 에러가 발생해야 한다
- 응답이 배열 형태여야 한다
- 피평가자 항목에 필수 필드가 포함되어야 한다
- 피평가자 정보에 직원 필드가 포함되어야 한다
- 피평가자 부서 정보가 포함되어야 한다
- 요청자(mappedBy) 정보가 포함되어야 한다
- UUID 필드가 유효한 UUID 형식이어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluatorId',
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiQuery)({
        name: 'periodId',
        description: '평가기간 ID (필터)',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiQuery)({
        name: 'includeCompleted',
        description: '완료된 평가 포함 여부',
        required: false,
        type: String,
        example: 'false',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '평가자에게 할당된 피평가자 목록이 성공적으로 조회되었습니다.',
        type: [peer_evaluation_dto_1.AssignedEvaluateeDto],
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가자를 찾을 수 없습니다.',
    }));
}
function CancelPeerEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Delete)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({
        summary: '동료평가 요청 취소',
        description: `관리자가 보낸 동료평가 요청을 취소합니다.

**동작:**
- 평가 상태를 "cancelled"로 변경
- 작성 중이거나 완료된 평가도 취소 가능
- 평가자는 더 이상 해당 평가를 볼 수 없음`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '동료평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: '동료평가 요청이 성공적으로 취소되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '동료평가를 찾을 수 없습니다.',
    }));
}
function CancelPeerEvaluationsByPeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Delete)('evaluatee/:evaluateeId/period/:periodId/cancel-all'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가기간의 피평가자의 모든 동료평가 요청 취소',
        description: `특정 피평가자의 특정 평가기간 내 모든 동료평가 요청을 일괄 취소합니다.

**동작:**
- 해당 피평가자에게 할당된 모든 평가 요청을 취소
- 모든 평가 상태를 "cancelled"로 변경
- 취소된 평가 개수를 반환
- 완료된 평가도 취소 가능

**테스트 케이스:**
- 기본 일괄 취소: 피평가자와 평가기간을 지정하여 모든 평가를 취소할 수 있음
- 다중 평가 취소: 여러 평가자의 평가를 한 번에 취소할 수 있음
- 평가기간 필터링: 특정 평가기간의 평가만 취소됨
- 취소할 평가 없음: 취소할 평가가 없으면 0을 반환함
- 잘못된 evaluateeId: 잘못된 형식의 evaluateeId로 요청 시 400 에러
- 잘못된 periodId: 잘못된 형식의 periodId로 요청 시 400 에러
- 존재하지 않는 evaluateeId: 존재하지 않는 evaluateeId로 요청 시 200 반환, cancelledCount는 0
- 존재하지 않는 periodId: 존재하지 않는 periodId로 요청 시 200 반환, cancelledCount는 0
- 필수 필드 검증: 응답에 message와 cancelledCount 필드가 포함됨
- 숫자 형식 검증: cancelledCount가 숫자 형식임
- 문자열 형식 검증: message가 문자열 형식임
- 상태 변경 검증: 취소된 평가의 상태가 'cancelled'로 변경됨
- 타임스탬프 갱신: 취소된 평가의 updatedAt이 갱신됨
- 격리성 검증: 다른 피평가자의 평가는 영향받지 않음
- 완료된 평가 취소: 완료된 평가도 취소할 수 있음`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '동료평가 요청들이 성공적으로 취소되었습니다.',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: '동료평가 요청들이 성공적으로 취소되었습니다.',
                },
                cancelledCount: {
                    type: 'number',
                    example: 5,
                    description: '취소된 동료평가 요청 개수',
                },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '피평가자 또는 평가기간을 찾을 수 없습니다.',
    }));
}
function UpsertPeerEvaluationAnswers() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(':id/answers'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '동료평가 질문 답변 저장/업데이트 (Upsert)',
        description: `동료평가에 매핑된 질문들에 대한 답변을 저장하거나 업데이트합니다.

**동작:**
- 동료평가에 매핑된 질문의 답변을 저장/업데이트 (Upsert)
- 기존 답변이 있으면 업데이트
- 기존 답변이 없으면 신규 저장
- 동료평가 상태가 PENDING이면 자동으로 IN_PROGRESS로 변경
- 매핑되지 않은 질문의 답변은 무시 (스킵)

**테스트 케이스:**
- 단일 질문 답변 저장: 1개의 질문에 대한 답변 저장 성공
- 복수 질문 답변 저장: 여러 질문에 대한 답변을 한 번에 저장
- 답변 업데이트: 기존 답변이 있을 때 새 답변으로 업데이트됨
- 상태 변경 확인: PENDING 상태에서 답변 저장 시 IN_PROGRESS로 변경됨
- 매핑되지 않은 질문 무시: 동료평가에 매핑되지 않은 질문의 답변은 스킵됨
- 잘못된 동료평가 ID: 유효하지 않은 UUID 형식의 ID로 요청 시 400 에러
- 존재하지 않는 동료평가: 존재하지 않는 ID로 요청 시 404 에러
- 취소된 동료평가: 취소된 동료평가에 답변 저장 시 404 에러
- 답변 목록 누락: answers 배열이 비어있거나 누락 시 400 에러
- 필수 필드 누락: questionId 또는 answer 누락 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '동료평가 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiBody)({
        type: peer_evaluation_dto_1.UpsertPeerEvaluationAnswersDto,
        description: '답변 저장/업데이트 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '답변이 성공적으로 저장/업데이트되었습니다.',
        type: peer_evaluation_dto_1.UpsertPeerEvaluationAnswersResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '동료평가를 찾을 수 없거나 취소된 동료평가입니다.',
    }));
}
//# sourceMappingURL=peer-evaluation-api.decorators.js.map