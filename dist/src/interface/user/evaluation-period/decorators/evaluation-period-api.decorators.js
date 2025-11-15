"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetActiveEvaluationPeriods = GetActiveEvaluationPeriods;
exports.GetEvaluationPeriods = GetEvaluationPeriods;
exports.GetEvaluationPeriodDetail = GetEvaluationPeriodDetail;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_period_response_dto_1 = require("../dto/evaluation-period-response.dto");
function GetActiveEvaluationPeriods() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('active'), (0, swagger_1.ApiOperation)({
        summary: '활성 평가 기간 조회',
        description: `**중요**: 오직 상태가 'in-progress'인 평가 기간만 반환됩니다. 대기 중('waiting')이나 완료된('completed') 평가 기간은 포함되지 않습니다.

**테스트 케이스:**
- 빈 상태: 활성 평가 기간이 없을 때 빈 배열 반환
- 다중 활성 기간: 여러 평가 기간 중 'in-progress' 상태인 기간만 필터링하여 반환
- 상태 확인: 반환된 평가 기간의 상태가 'in-progress'로 설정됨
- 완료된 기간 제외: 완료된('completed') 평가 기간은 활성 목록에서 제외됨
- 대기 중 기간 제외: 대기 중('waiting') 평가 기간은 활성 목록에 포함되지 않음
- 부분 완료: 여러 활성 기간 중 일부만 완료해도 나머지는 활성 목록에 유지됨`,
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '활성 평가 기간 목록',
        type: [evaluation_period_response_dto_1.EvaluationPeriodResponseDto],
    }));
}
function GetEvaluationPeriods() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(''), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 목록 조회',
        description: `**중요**: 모든 상태('waiting', 'in-progress', 'completed')의 평가 기간이 포함됩니다. 삭제된 평가 기간은 제외됩니다.

**테스트 케이스:**
- 빈 목록: 평가 기간이 없을 때 빈 배열과 페이징 정보 반환
- 다양한 평가 기간: 7개의 서로 다른 평가 기간을 3페이지로 나누어 조회
- 페이징 검증: 각 페이지의 항목들이 중복되지 않고 전체 개수가 일치함
- 페이지 범위 초과: 존재하지 않는 페이지 요청 시 빈 목록 반환
- 다양한 페이지 크기: 1, 2, 10개 등 다양한 limit 값으로 조회
- 모든 상태 포함: 대기, 진행 중, 완료된 평가 기간이 모두 목록에 포함됨
- 삭제된 기간 제외: 삭제된 평가 기간은 목록에서 제외됨
- 특수 이름: 특수문자, 한글, 영문이 포함된 이름의 평가 기간 조회
- 에러 처리: 잘못된 페이지/limit 값(음수, 0, 문자열 등)에 대한 적절한 응답`,
    }), (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        description: '페이지 번호 (기본값: 1, 최소값: 1)',
        example: 1,
    }), (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: '페이지 크기 (기본값: 10, 최소값: 1)',
        example: 10,
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 목록 (페이징 정보 포함)',
        type: evaluation_period_response_dto_1.EvaluationPeriodListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 페이징 파라미터 (음수, 문자열 등)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function GetEvaluationPeriodDetail() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 상세 조회',
        description: `**테스트 케이스:**
- 기본 조회: 존재하는 평가 기간의 상세 정보 조회 (등급 구간, 날짜 필드 포함)
- 존재하지 않는 ID: null 반환 (404가 아닌 200 상태로 null 반환)
- 다양한 상태: 대기('waiting'), 활성('in-progress'), 완료('completed') 상태별 조회
- 복잡한 등급 구간: 7개 등급(S+, S, A+, A, B+, B, C) 구간을 가진 평가 기간 조회
- 삭제된 평가 기간: 삭제된 평가 기간 조회 시 null 반환
- 에러 처리: 잘못된 UUID 형식, 특수문자, SQL 인젝션 시도 등에 대한 적절한 에러 응답`,
    }), (0, swagger_1.ApiParam)({ name: 'id', description: '평가 기간 ID (UUID 형식)' }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 상세 정보 (존재하지 않을 경우 null 반환)',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
//# sourceMappingURL=evaluation-period-api.decorators.js.map