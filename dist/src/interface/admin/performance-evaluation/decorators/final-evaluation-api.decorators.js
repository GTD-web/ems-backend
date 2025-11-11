"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertFinalEvaluation = UpsertFinalEvaluation;
exports.ConfirmFinalEvaluation = ConfirmFinalEvaluation;
exports.CancelConfirmationFinalEvaluation = CancelConfirmationFinalEvaluation;
exports.GetFinalEvaluation = GetFinalEvaluation;
exports.GetFinalEvaluationList = GetFinalEvaluationList;
exports.GetFinalEvaluationByEmployeePeriod = GetFinalEvaluationByEmployeePeriod;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const common_2 = require("@nestjs/common");
const final_evaluation_dto_1 = require("../dto/final-evaluation.dto");
function UpsertFinalEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('employee/:employeeId/period/:periodId'), (0, common_1.HttpCode)(common_2.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '최종평가 저장 (Upsert)',
        description: `직원과 평가기간 조합으로 최종평가를 저장합니다. 이미 존재하면 수정, 없으면 생성됩니다.

**동작:**
- 직원-평가기간 조합으로 최종평가를 Upsert (없으면 생성, 있으면 수정)
- 평가등급, 직무등급, 직무 상세등급 필수 입력
- 최종 평가 의견은 선택사항
- 초기 생성 시 isConfirmed는 false로 설정
- 동일한 직원-평가기간 조합에는 하나의 평가만 존재

**테스트 케이스:**
- 기본 최종평가를 저장(생성)할 수 있어야 한다
- 최종평가 의견을 포함하여 저장할 수 있어야 한다
- actionBy를 포함하여 저장할 수 있어야 한다
- actionBy 없이도 저장할 수 있어야 한다 (기본값 사용)
- 이미 존재하는 평가를 수정(Upsert)할 수 있어야 한다
- 다양한 평가등급으로 저장할 수 있어야 한다
- 다양한 직무등급 조합으로 저장할 수 있어야 한다
- 잘못된 형식의 employeeId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다
- evaluationGrade 누락 시 400 에러가 발생해야 한다
- jobGrade 누락 시 400 에러가 발생해야 한다
- jobDetailedGrade 누락 시 400 에러가 발생해야 한다
- 잘못된 jobGrade 값으로 요청 시 400 에러가 발생해야 한다
- 잘못된 jobDetailedGrade 값으로 요청 시 400 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 평가 ID가 유효한 UUID 형식이어야 한다
- 저장된 데이터가 DB의 실제 데이터와 일치해야 한다
- 초기 생성 시 isConfirmed가 false여야 한다
- 초기 생성 시 confirmedAt과 confirmedBy가 null이어야 한다
- 생성 시 createdAt과 updatedAt이 설정되어야 한다
- 수정 시 updatedAt이 갱신되어야 한다
- 같은 직원-평가기간 조합에 대해 하나의 평가만 존재해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID',
        example: 'employee-uuid',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        example: 'period-uuid',
    }), (0, swagger_1.ApiBody)({ type: final_evaluation_dto_1.UpsertFinalEvaluationBodyDto }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.OK,
        description: '최종평가가 성공적으로 저장되었습니다.',
        type: final_evaluation_dto_1.FinalEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터',
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.UNPROCESSABLE_ENTITY,
        description: '확정된 평가는 수정할 수 없습니다.',
    }));
}
function ConfirmFinalEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(':id/confirm'), (0, common_1.HttpCode)(common_2.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '최종평가 확정',
        description: `최종평가를 확정합니다. 확정 후에는 수정/삭제가 불가능합니다.

**동작:**
- 최종평가의 확정 상태를 true로 변경
- 확정 일시(confirmedAt)를 현재 시간으로 설정
- 확정자 ID(confirmedBy)를 기록
- 버전(version)을 1 증가
- 수정 일시(updatedAt)를 갱신

**테스트 케이스:**
- 기본 최종평가를 확정할 수 있어야 한다
- confirmedBy를 포함하여 확정할 수 있어야 한다
- 확정 후 isConfirmed가 true로 변경되어야 한다
- 확정 후 confirmedAt이 설정되어야 한다
- 확정 후 updatedAt이 갱신되어야 한다
- 잘못된 형식의 평가 ID로 확정 시 400 에러가 발생해야 한다
- 존재하지 않는 평가 ID로 확정 시 404 에러가 발생해야 한다
- confirmedBy 누락 시 400 에러가 발생해야 한다
- 이미 확정된 평가를 다시 확정 시 409 에러가 발생해야 한다
- 응답에 message 필드가 포함되어야 한다
- 성공 메시지가 적절해야 한다
- 확정된 데이터가 DB의 실제 데이터와 일치해야 한다
- 확정 후에도 평가 등급 데이터는 유지되어야 한다
- 확정 후 createdAt은 변경되지 않아야 한다
- 확정 시 version이 증가해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '최종평가 ID',
        example: '345e6789-e89b-12d3-a456-426614174002',
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.OK,
        description: '최종평가가 성공적으로 확정되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.NOT_FOUND,
        description: '최종평가를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.CONFLICT,
        description: '이미 확정된 평가입니다.',
    }));
}
function CancelConfirmationFinalEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(':id/cancel-confirmation'), (0, common_1.HttpCode)(common_2.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '최종평가 확정 취소',
        description: `확정된 최종평가를 취소하여 다시 수정 가능하게 합니다.

**동작:**
- 최종평가의 확정 상태를 false로 변경
- 확정 일시(confirmedAt)를 null로 초기화
- 확정자 ID(confirmedBy)를 null로 초기화
- 버전(version)을 1 증가
- 수정 일시(updatedAt)를 갱신
- 취소 후 평가 수정이 다시 가능

**테스트 케이스:**
- 확정된 최종평가의 확정을 취소할 수 있어야 한다
- updatedBy를 포함하여 확정 취소할 수 있어야 한다
- 확정 취소 후 isConfirmed가 false로 변경되어야 한다
- 확정 취소 후 confirmedAt과 confirmedBy가 null로 변경되어야 한다
- 확정 취소 후 updatedAt이 갱신되어야 한다
- 잘못된 형식의 평가 ID로 확정 취소 시 400 에러가 발생해야 한다
- 존재하지 않는 평가 ID로 확정 취소 시 404 에러가 발생해야 한다
- updatedBy 누락 시 400 에러가 발생해야 한다
- 확정되지 않은 평가의 확정 취소 시 422 에러가 발생해야 한다
- 응답에 message 필드가 포함되어야 한다
- 성공 메시지가 적절해야 한다
- 취소된 데이터가 DB의 실제 데이터와 일치해야 한다
- 확정 취소 후에도 평가 등급 데이터는 유지되어야 한다
- 확정 취소 후 createdAt은 변경되지 않아야 한다
- 확정 취소 시 version이 증가해야 한다
- 확정 취소 후 다시 수정이 가능해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '최종평가 ID',
        example: '345e6789-e89b-12d3-a456-426614174002',
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.OK,
        description: '최종평가 확정이 성공적으로 취소되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.NOT_FOUND,
        description: '최종평가를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.UNPROCESSABLE_ENTITY,
        description: '확정되지 않은 평가입니다.',
    }));
}
function GetFinalEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({
        summary: '최종평가 조회',
        description: `ID로 최종평가 상세정보를 조회합니다.

**동작:**
- 최종평가 ID로 단일 평가 조회
- 직원 정보를 객체로 반환 (id, name, employeeNumber, email)
- 평가기간 정보를 객체로 반환 (id, name, startDate, endDate, status)
- 평가 등급 정보 포함 (evaluationGrade, jobGrade, jobDetailedGrade)
- 확정 정보 포함 (isConfirmed, confirmedAt, confirmedBy)
- 메타데이터 포함 (createdAt, updatedAt, createdBy, updatedBy, version)
- 존재하지 않는 ID 조회 시 404 에러 반환

**응답 구조:**
- ID 중복 제거: 직원 ID와 평가기간 ID는 각 객체 내에만 포함
- 중첩 객체: employee, period를 객체로 반환
- 날짜 형식: ISO 8601 형식으로 반환

**테스트 케이스:**
- 기본 최종평가를 조회할 수 있어야 한다
- 직원 정보가 객체로 반환되어야 한다
- 평가기간 정보가 객체로 반환되어야 한다
- 평가 등급 정보가 정확히 반환되어야 한다
- 확정 정보가 정확히 반환되어야 한다
- 미확정 평가는 확정 정보가 null이어야 한다
- 잘못된 형식의 ID로 조회 시 400 에러가 발생해야 한다
- 존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 직원 객체에 필수 필드가 모두 포함되어야 한다
- 평가기간 객체에 필수 필드가 모두 포함되어야 한다
- ID가 유효한 UUID 형식이어야 한다
- 날짜가 유효한 ISO 8601 형식이어야 한다
- 조회된 데이터가 DB의 실제 데이터와 일치해야 한다
- 확정 상태가 DB와 일치해야 한다
- 확정 취소 후 조회 시 확정 정보가 null이어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '최종평가 ID',
        example: '345e6789-e89b-12d3-a456-426614174002',
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.OK,
        description: '최종평가 조회 성공',
        type: final_evaluation_dto_1.FinalEvaluationDetailDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.NOT_FOUND,
        description: '최종평가를 찾을 수 없습니다.',
    }));
}
function GetFinalEvaluationList() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(), (0, swagger_1.ApiOperation)({
        summary: '최종평가 목록 조회',
        description: `필터 조건에 따라 최종평가 목록을 조회합니다.

**동작:**
- 페이지네이션 지원 (기본: page=1, limit=10)
- 다양한 필터 조건 지원 (employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, confirmedOnly)
- 직원 정보를 객체로 반환 (id, name, employeeNumber, email)
- 평가기간 정보를 객체로 반환 (id, name, startDate, endDate, status)
- 생성일시 역순 정렬 (최신순)

**응답 구조:**
- ID 중복 제거: 직원 ID와 평가기간 ID는 각 객체 내에만 포함
- 중첩 객체: employee, period를 객체로 반환
- 페이지네이션 정보: total, page, limit 포함
- 빈 배열도 정상 응답

**테스트 케이스:**
- 기본 목록을 조회할 수 있어야 한다
- 직원 정보가 객체로 반환되어야 한다
- 평가기간 정보가 객체로 반환되어야 한다
- 페이지네이션이 작동해야 한다
- employeeId로 필터링할 수 있어야 한다
- periodId로 필터링할 수 있어야 한다
- evaluationGrade로 필터링할 수 있어야 한다
- confirmedOnly로 필터링할 수 있어야 한다
- createdAt 역순으로 정렬되어야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 직원 객체에 필수 필드가 모두 포함되어야 한다
- 평가기간 객체에 필수 필드가 모두 포함되어야 한다
- 빈 목록도 정상적으로 반환되어야 한다`,
    }), (0, swagger_1.ApiQuery)({ type: final_evaluation_dto_1.FinalEvaluationFilterDto }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.OK,
        description: '최종평가 목록 조회 성공',
        type: final_evaluation_dto_1.FinalEvaluationListResponseDto,
    }));
}
function GetFinalEvaluationByEmployeePeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('employee/:employeeId/period/:periodId'), (0, swagger_1.ApiOperation)({
        summary: '직원-평가기간별 최종평가 조회',
        description: `특정 직원의 특정 평가기간 최종평가를 조회합니다.

**동작:**
- 직원-평가기간 조합으로 최종평가 조회
- 직원 정보를 객체로 반환 (id, name, employeeNumber, email)
- 평가기간 정보를 객체로 반환 (id, name, startDate, endDate, status)
- 평가 등급 정보 포함 (evaluationGrade, jobGrade, jobDetailedGrade)
- 확정 정보 포함 (isConfirmed, confirmedAt, confirmedBy)
- 메타데이터 포함 (createdAt, updatedAt, createdBy, updatedBy, version)

**응답 구조:**
- ID 중복 제거: 직원 ID와 평가기간 ID는 각 객체 내에만 포함
- 중첩 객체: employee, period를 객체로 반환
- 날짜 형식: ISO 8601 형식으로 반환

**테스트 케이스:**
- 기본 최종평가를 조회할 수 있어야 한다
- 직원 정보가 객체로 반환되어야 한다
- 평가기간 정보가 객체로 반환되어야 한다
- 평가 등급 정보가 정확히 반환되어야 한다
- 확정 정보가 정확히 반환되어야 한다
- 미확정 평가는 확정 정보가 null이어야 한다
- 잘못된 형식의 직원 ID로 조회 시 400 에러가 발생해야 한다
- 잘못된 형식의 평가기간 ID로 조회 시 400 에러가 발생해야 한다
- 존재하지 않는 직원-평가기간 조합으로 조회 시 204 응답이 반환되어야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 직원 객체에 필수 필드가 모두 포함되어야 한다
- 평가기간 객체에 필수 필드가 모두 포함되어야 한다
- ID가 유효한 UUID 형식이어야 한다
- 날짜가 유효한 ISO 8601 형식이어야 한다
- 조회된 데이터가 DB의 실제 데이터와 일치해야 한다
- 확정 상태가 DB와 일치해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        example: '234e5678-e89b-12d3-a456-426614174001',
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.OK,
        description: '최종평가 조회 성공',
        type: final_evaluation_dto_1.FinalEvaluationDetailDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_2.HttpStatus.NOT_FOUND,
        description: '최종평가를 찾을 수 없습니다.',
    }));
}
//# sourceMappingURL=final-evaluation-api.decorators.js.map