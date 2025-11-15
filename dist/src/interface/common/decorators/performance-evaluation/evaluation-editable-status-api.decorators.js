"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePeriodAllEvaluationEditableStatus = UpdatePeriodAllEvaluationEditableStatus;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_editable_status_dto_1 = require("../../dto/performance-evaluation/evaluation-editable-status.dto");
function UpdatePeriodAllEvaluationEditableStatus() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('period/:periodId/all'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가기간별 모든 평가 수정 가능 상태 일괄 변경',
        description: `**중요**: 특정 평가기간의 모든 평가 대상자에 대한 평가 수정 가능 상태를 일괄 변경합니다. 평가 진행 단계에 따라 한 번에 여러 직원의 평가 상태를 제어할 수 있어, 평가 운영 효율성을 높입니다.

**사용 시나리오:**
- 평가 시작: 자기평가만 수정 가능하도록 설정 (isSelfEvaluationEditable: true, isPrimaryEvaluationEditable: false, isSecondaryEvaluationEditable: false)
- 1차평가 시작: 자기평가 잠금, 1차평가 수정 가능하도록 설정 (isSelfEvaluationEditable: false, isPrimaryEvaluationEditable: true, isSecondaryEvaluationEditable: false)
- 2차평가 시작: 1차평가 잠금, 2차평가 수정 가능하도록 설정 (isSelfEvaluationEditable: false, isPrimaryEvaluationEditable: false, isSecondaryEvaluationEditable: true)
- 평가 종료: 모든 평가 수정 불가능하도록 설정 (모든 필드 false)
- 특별 케이스: 관리자 요청으로 일시적으로 모든 평가 수정 가능 (모든 필드 true)

**테스트 케이스:**
- 일괄 변경: 해당 평가기간의 모든 대상자(직원)의 수정 가능 상태가 동시에 변경됨
- 변경된 개수 반환: 실제 변경된 맵핑의 개수를 응답으로 반환
- 단계별 잠금: 자기평가, 1차평가, 2차평가 각각을 독립적으로 잠금/해제 가능
- 빈 평가기간: 평가 대상자가 없는 평가기간의 경우에도 정상 처리 (updatedCount: 0)
- 부분 대상자: 일부 대상자만 있는 평가기간도 정상 처리
- updatedBy 선택사항: 수정자 ID 없이도 일괄 변경 가능
- DB 일관성: 모든 대상자의 상태가 동일한 값으로 일괄 변경됨
- updatedAt 갱신: 변경된 모든 맵핑의 수정일시가 업데이트됨
- 트랜잭션 보장: 일부 실패 시 전체 롤백 처리
- 필수 필드 검증: isSelfEvaluationEditable, isPrimaryEvaluationEditable, isSecondaryEvaluationEditable 필드 필수
- 필드 타입 검증: 각 필드가 boolean 타입이어야 함
- 존재하지 않는 평가기간: 유효하지 않은 평가기간 ID로 요청 시 404 에러
- 잘못된 UUID 형식: periodId가 UUID 형식이 아닐 때 400 에러
- 잘못된 updatedBy: updatedBy가 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: 응답에 updatedCount, evaluationPeriodId, 수정 가능 상태 필드들 포함
- 대용량 처리: 100명 이상의 평가 대상자를 가진 평가기간도 효율적으로 처리
- 동시 변경: 동일 평가기간에 대한 동시 일괄 변경 요청 처리
- 성능 테스트: 대량 업데이트 시 적절한 응답 시간 유지 (5초 이내)`,
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiBody)({
        type: evaluation_editable_status_dto_1.UpdatePeriodAllEvaluationEditableStatusDto,
        description: '평가 수정 가능 상태 설정 (모든 boolean 필드 필수)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '평가기간의 모든 평가 수정 가능 상태가 성공적으로 변경되었습니다. 변경된 개수와 설정 정보를 반환합니다.',
        type: evaluation_editable_status_dto_1.PeriodAllEvaluationEditableStatusResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터 (필수 필드 누락, UUID 형식 오류, 잘못된 boolean 타입 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가기간을 찾을 수 없습니다. (존재하지 않거나 삭제됨)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패, 대량 업데이트 실패 등)',
    }));
}
//# sourceMappingURL=evaluation-editable-status-api.decorators.js.map