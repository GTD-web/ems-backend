"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnregisterAllEvaluationTargets = exports.UnregisterEvaluationTarget = exports.GetUnregisteredEmployees = exports.CheckEvaluationTarget = exports.GetEmployeeEvaluationPeriods = exports.GetExcludedEvaluationTargets = exports.GetEvaluationTargets = exports.IncludeEvaluationTarget = exports.ExcludeEvaluationTarget = exports.RegisterBulkEvaluationTargets = exports.RegisterEvaluationTarget = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_target_dto_1 = require("../../dto/evaluation-period/evaluation-target.dto");
const RegisterEvaluationTarget = () => (0, common_1.applyDecorators)((0, common_1.Post)(':evaluationPeriodId/targets/:employeeId'), (0, swagger_1.ApiOperation)({
    summary: '평가 대상자 등록',
    description: `**중요**: 특정 평가기간에 직원을 평가 대상자로 등록합니다. 등록된 대상자는 기본적으로 평가 대상(isExcluded: false)으로 설정됩니다.

**테스트 케이스:**
- 기본 등록: 유효한 평가기간 ID와 직원 ID로 평가 대상자 등록
- 상태 확인: 등록된 평가 대상자의 isExcluded가 false로 설정됨
- 제외 필드 초기화: excludeReason, excludedBy, excludedAt가 모두 null로 설정됨
- DB 저장 확인: 등록 후 DB에 정보가 정상적으로 저장됨
- 다중 평가기간: 동일한 직원을 여러 평가기간에 등록 가능 (평가기간별로 독립적인 맵핑)
- 존재하지 않는 평가기간: 평가기간 미존재 시 404 에러
- 존재하지 않는 직원: 직원 미존재 시 404 에러
- 중복 등록: 이미 등록된 평가 대상자 재등록 시 409 에러
- 잘못된 평가기간 UUID: 형식이 올바르지 않은 평가기간 ID로 요청 시 400 에러
- 잘못된 직원 UUID: 형식이 올바르지 않은 직원 ID로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: String,
    example: '223e4567-e89b-12d3-a456-426614174001',
}), (0, swagger_1.ApiCreatedResponse)({
    description: '평가 대상자 등록 성공',
    type: evaluation_target_dto_1.EvaluationTargetMappingResponseDto,
}), (0, swagger_1.ApiBadRequestResponse)({ description: '잘못된 요청' }), (0, swagger_1.ApiNotFoundResponse)({ description: '평가기간 또는 직원을 찾을 수 없음' }), (0, swagger_1.ApiConflictResponse)({ description: '이미 등록된 평가 대상자' }));
exports.RegisterEvaluationTarget = RegisterEvaluationTarget;
const RegisterBulkEvaluationTargets = () => (0, common_1.applyDecorators)((0, common_1.Post)(':evaluationPeriodId/targets/bulk'), (0, swagger_1.ApiOperation)({
    summary: '평가 대상자 대량 등록',
    description: `**중요**: 특정 평가기간에 여러 직원을 평가 대상자로 대량 등록합니다. 이미 등록된 직원은 자동으로 제외되며, 신규 직원만 등록됩니다.

**테스트 케이스:**
- 기본 대량 등록: 여러 직원을 동시에 평가 대상자로 등록
- 배열 응답: 등록된 모든 맵핑 정보를 배열로 반환
- 전체 맵핑 확인: 응답 배열의 길이가 요청한 직원 수와 일치
- 개별 맵핑 검증: 각 맵핑의 evaluationPeriodId, employeeId, isExcluded, createdBy 필드 확인
- 중복 제외: 이미 등록된 직원이 포함된 경우 중복을 제외하고 신규 직원만 등록
- 혼합 등록: 기존 등록 직원과 신규 직원을 함께 요청 시 기존 직원 포함하여 모두 반환
- DB 확인: 대량 등록 후 DB에 올바른 개수가 저장됨
- 전체 직원 등록: 모든 직원을 한 번에 등록 가능
- 초기 상태: 대량 등록된 모든 대상자가 isExcluded: false, 제외 필드 모두 null
- 단일 직원 배열: 1명만 포함된 배열로도 대량 등록 가능
- 동시성 처리: 동일한 평가기간에 대해 동시에 대량 등록 요청 시 정상 처리
- 최대 직원 수: 많은 수의 직원을 한 번에 등록 가능
- 배열 내 중복: 요청 배열 내 중복된 직원 ID가 있어도 한 번만 등록됨
- 빈 배열: 빈 배열로 요청 시 400 에러
- 잘못된 직원 UUID: 배열 내 잘못된 UUID 형식 포함 시 400 에러
- 존재하지 않는 평가기간: 평가기간 미존재 시 404 에러
- 필수 필드 누락: employeeIds 누락 시 400 에러
- 배열 타입 검증: employeeIds가 배열이 아닌 경우 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiCreatedResponse)({
    description: '평가 대상자 대량 등록 성공',
    type: [evaluation_target_dto_1.EvaluationTargetMappingResponseDto],
}), (0, swagger_1.ApiBadRequestResponse)({ description: '잘못된 요청' }), (0, swagger_1.ApiNotFoundResponse)({ description: '평가기간을 찾을 수 없음' }));
exports.RegisterBulkEvaluationTargets = RegisterBulkEvaluationTargets;
const ExcludeEvaluationTarget = () => (0, common_1.applyDecorators)((0, common_1.Patch)(':evaluationPeriodId/targets/:employeeId/exclude'), (0, swagger_1.ApiOperation)({
    summary: '평가 대상 제외',
    description: `**중요**: 특정 평가기간에서 직원을 평가 대상에서 제외합니다. 제외된 대상자는 isExcluded가 true로 변경되며, 제외 사유와 처리자 정보가 저장됩니다.

**테스트 케이스:**
- 기본 제외: 평가 대상자를 성공적으로 제외 처리
- 상태 변경: isExcluded가 false에서 true로 변경됨
- 제외 정보 저장: excludeReason, excludedBy, excludedAt 필드가 올바르게 저장됨
- DB 저장 확인: 제외 정보가 DB에 정상적으로 저장됨
- 시간 검증: excludedAt 필드가 현재 시간으로 정확하게 설정됨
- 등록되지 않은 대상자: 평가 대상자로 등록되지 않은 경우 404 에러
- 중복 제외: 이미 제외된 대상자를 다시 제외 시 409 에러
- 제외 사유 누락: excludeReason 필드 누락 시 400 에러
- 잘못된 평가기간 UUID: 형식이 올바르지 않은 평가기간 ID로 요청 시 400 에러
- 잘못된 직원 UUID: 형식이 올바르지 않은 직원 ID로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: String,
    example: '223e4567-e89b-12d3-a456-426614174001',
}), (0, swagger_1.ApiOkResponse)({
    description: '평가 대상 제외 성공',
    type: evaluation_target_dto_1.EvaluationTargetMappingResponseDto,
}), (0, swagger_1.ApiBadRequestResponse)({ description: '잘못된 요청' }), (0, swagger_1.ApiNotFoundResponse)({ description: '평가 대상자를 찾을 수 없음' }), (0, swagger_1.ApiConflictResponse)({ description: '이미 제외된 평가 대상자' }));
exports.ExcludeEvaluationTarget = ExcludeEvaluationTarget;
const IncludeEvaluationTarget = () => (0, common_1.applyDecorators)((0, common_1.Patch)(':evaluationPeriodId/targets/:employeeId/include'), (0, swagger_1.ApiOperation)({
    summary: '평가 대상 포함 (제외 취소)',
    description: `**중요**: 평가 대상에서 제외된 직원을 다시 평가 대상에 포함시킵니다. isExcluded가 false로 변경되고 모든 제외 관련 필드가 초기화됩니다.

**테스트 케이스:**
- 기본 포함: 제외된 대상자를 성공적으로 다시 평가 대상에 포함
- 상태 변경: isExcluded가 true에서 false로 변경됨
- 제외 정보 초기화: excludeReason, excludedBy, excludedAt가 모두 null로 초기화됨
- DB 저장 확인: 포함 처리 후 제외 정보가 DB에서 null로 초기화됨
- 반복 제외/포함: 제외 → 포함 → 다시 제외가 정상적으로 동작함
- 등록되지 않은 대상자: 평가 대상자로 등록되지 않은 경우 404 에러
- 제외되지 않은 대상자: 제외되지 않은 대상자를 포함 시 409 에러
- 중복 포함: 이미 포함된 대상자를 다시 포함 시 409 에러
- 잘못된 평가기간 UUID: 형식이 올바르지 않은 평가기간 ID로 요청 시 400 에러
- 잘못된 직원 UUID: 형식이 올바르지 않은 직원 ID로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: String,
    example: '223e4567-e89b-12d3-a456-426614174001',
}), (0, swagger_1.ApiOkResponse)({
    description: '평가 대상 포함 성공',
    type: evaluation_target_dto_1.EvaluationTargetMappingResponseDto,
}), (0, swagger_1.ApiBadRequestResponse)({ description: '잘못된 요청' }), (0, swagger_1.ApiNotFoundResponse)({ description: '평가 대상자를 찾을 수 없음' }), (0, swagger_1.ApiConflictResponse)({ description: '이미 포함된 평가 대상자' }));
exports.IncludeEvaluationTarget = IncludeEvaluationTarget;
const GetEvaluationTargets = () => (0, common_1.applyDecorators)((0, common_1.Get)(':evaluationPeriodId/targets'), (0, swagger_1.ApiOperation)({
    summary: '평가기간의 평가 대상자 조회',
    description: `**중요**: 특정 평가기간의 평가 대상자 목록을 조회합니다. includeExcluded 파라미터로 제외된 대상자 포함 여부를 제어할 수 있습니다. 각 평가 대상자 정보에는 직원 상세 정보(employee 객체)가 함께 포함됩니다.

**테스트 케이스:**
- 기본 조회: 평가기간의 모든 평가 대상자를 조회
- 필수 필드 검증: id, employee, isExcluded, createdBy, createdAt 필드 포함
- 중복 필드 제거: targets 배열의 개별 항목에서 evaluationPeriodId, employeeId가 undefined로 제거됨
- 직원 정보 포함: employee 객체에 id 및 기타 직원 정보 포함
- includeExcluded 미전달: 기본값 false 적용되어 제외된 대상자가 포함되지 않음 (200)
- includeExcluded=false: 제외된 대상자 미포함, isExcluded=false인 대상자만 반환 (200)
- includeExcluded=true: 제외된 대상자도 포함하여 조회 (200)
- 제외 상태 확인: includeExcluded=false 시 반환된 모든 대상자의 isExcluded가 false
- 제외 수 확인: includeExcluded=true 시 제외된 대상자 수 확인 가능
- 빈 결과: 평가 대상자가 없는 경우 빈 배열 반환 (200)
- 허용된 값: includeExcluded에 "true", "false", "1", "0" 허용 (200)
- 존재하지 않는 평가기간: 평가기간 미존재 시 빈 배열 반환 (200)
- 잘못된 UUID: 잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러
- 잘못된 includeExcluded 값: "yes", "no", "invalid", "2" 등 허용되지 않는 값 입력 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiQuery)({
    name: 'includeExcluded',
    required: false,
    description: '제외된 대상자 포함 여부 (기본값: false, 가능값: "true", "false", "1", "0")',
    type: String,
    example: 'false',
}), (0, swagger_1.ApiOkResponse)({
    description: '평가 대상자 목록 조회 성공',
    type: evaluation_target_dto_1.EvaluationTargetsResponseDto,
}), (0, swagger_1.ApiBadRequestResponse)({
    description: '잘못된 요청 (잘못된 UUID 형식 또는 잘못된 includeExcluded 값)',
}));
exports.GetEvaluationTargets = GetEvaluationTargets;
const GetExcludedEvaluationTargets = () => (0, common_1.applyDecorators)((0, common_1.Get)(':evaluationPeriodId/targets/excluded'), (0, swagger_1.ApiOperation)({
    summary: '제외된 평가 대상자 조회',
    description: `**중요**: 특정 평가기간에서 제외된 평가 대상자 목록만 조회합니다. 모든 반환된 대상자는 isExcluded=true 상태입니다. 각 평가 대상자 정보에는 직원 상세 정보(employee 객체)가 함께 포함됩니다.

**테스트 케이스:**
- 기본 조회: 제외된 평가 대상자만 조회
- isExcluded 상태: 모든 대상자가 isExcluded=true 상태
- 모든 대상자 제외 검증: every() 메서드로 모든 대상자가 isExcluded=true인지 확인
- 제외 정보 포함: excludeReason, excludedBy, excludedAt 필드 정의됨
- 제외 정보 정확성: 지정한 제외 사유(excludeReason)와 제외자(excludedBy)가 올바르게 반환됨
- 빈 결과: 제외된 대상자가 없는 경우 빈 배열 반환 (200)
- 존재하지 않는 평가기간: 평가기간 미존재 시 빈 배열 반환 (200)
- 잘못된 UUID: 잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiOkResponse)({
    description: '제외된 평가 대상자 목록 조회 성공',
    type: evaluation_target_dto_1.EvaluationTargetsResponseDto,
}));
exports.GetExcludedEvaluationTargets = GetExcludedEvaluationTargets;
const GetEmployeeEvaluationPeriods = () => (0, common_1.applyDecorators)((0, common_1.Get)('employees/:employeeId/evaluation-periods'), (0, swagger_1.ApiOperation)({
    summary: '직원의 평가기간 맵핑 조회',
    description: `**중요**: 특정 직원이 등록된 모든 평가기간 맵핑 정보를 조회합니다. 제외된 맵핑도 포함하여 반환됩니다. 직원 정보는 최상위에 한 번만 제공되고, 맵핑 정보만 배열로 제공됩니다. 각 맵핑에는 evaluationPeriodId 대신 평가기간 객체(evaluationPeriod)가 포함됩니다.

**동작:**
- 직원이 등록된 모든 평가기간 맵핑 조회
- 각 맵핑에 평가기간 상세 정보 포함 (id, name, startDate, endDate, status, currentPhase)
- 제외된 맵핑도 포함하여 반환

**테스트 케이스:**
- 기본 조회: 직원이 등록된 모든 평가기간 맵핑을 조회
- 직원 정보 포함: employee 객체에 id 및 직원 기본 정보 포함
- 중복 필드 제거: mappings 배열의 개별 항목에서 employeeId가 undefined로 제거됨
- 평가기간 객체 포함: mappings 배열의 각 항목에 evaluationPeriod 객체가 포함됨 (id, name, startDate, endDate, status, currentPhase)
- 다중 평가기간: 여러 평가기간에 등록된 경우 모두 반환됨
- 제외 맵핑 포함: 제외된 평가기간 맵핑도 조회됨
- 제외 상태 확인: 제외된 맵핑의 isExcluded가 true로 설정됨
- 빈 맵핑: 등록된 평가기간이 없는 경우 빈 배열 반환 (200)
- 존재하지 않는 직원: 직원 미존재 시 빈 배열 반환 (200)
- 잘못된 UUID: 잘못된 UUID 형식의 직원 ID로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: String,
    example: '223e4567-e89b-12d3-a456-426614174001',
}), (0, swagger_1.ApiOkResponse)({
    description: '직원의 평가기간 맵핑 목록 조회 성공',
    type: evaluation_target_dto_1.EmployeeEvaluationPeriodsResponseDto,
}));
exports.GetEmployeeEvaluationPeriods = GetEmployeeEvaluationPeriods;
const CheckEvaluationTarget = () => (0, common_1.applyDecorators)((0, common_1.Get)(':evaluationPeriodId/targets/:employeeId/check'), (0, swagger_1.ApiOperation)({
    summary: '평가 대상 여부 확인',
    description: `**중요**: 특정 직원이 특정 평가기간의 평가 대상인지 확인합니다. 제외된 대상자는 false로 반환됩니다. 응답에는 평가기간 및 직원의 상세 정보가 포함됩니다.

**동작:**
- 평가 대상 여부 확인 (등록 여부)
- 평가기간 정보 포함 (id, name, startDate, endDate, status, currentPhase)
- 직원 정보 포함 (id, name, email, departmentName, rankName, status)

**테스트 케이스:**
- 등록된 대상자: 등록된 평가 대상자인 경우 isEvaluationTarget=true 반환 (200)
- 제외된 대상자: 제외된 대상자인 경우 isEvaluationTarget=false 반환 (200)
- 등록되지 않은 대상자: 등록되지 않은 경우 isEvaluationTarget=false 반환 (200)
- 반복 상태 변경: 포함 → 제외 → 다시 포함 시 isEvaluationTarget=true 반환 (200)
- 응답 필드 검증: evaluationPeriod 및 employee 객체 포함
- 평가기간 객체 검증: id, name, startDate, status 등 필드 포함
- 직원 객체 검증: id, name, email, status 등 필드 포함
- 잘못된 평가기간 UUID: 형식이 올바르지 않은 평가기간 ID로 요청 시 400 에러
- 잘못된 직원 UUID: 형식이 올바르지 않은 직원 ID로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: String,
    example: '223e4567-e89b-12d3-a456-426614174001',
}), (0, swagger_1.ApiOkResponse)({
    description: '평가 대상 여부 확인 성공',
    type: evaluation_target_dto_1.EvaluationTargetStatusResponseDto,
}), (0, swagger_1.ApiBadRequestResponse)({ description: '잘못된 요청' }));
exports.CheckEvaluationTarget = CheckEvaluationTarget;
const GetUnregisteredEmployees = () => (0, common_1.applyDecorators)((0, common_1.Get)(':evaluationPeriodId/targets/unregistered-employees'), (0, swagger_1.ApiOperation)({
    summary: '등록되지 않은 직원 목록 조회',
    description: `특정 평가기간에 평가 대상자로 등록되지 않은 활성 직원 목록을 조회합니다.

**동작:**
- 평가기간에 등록된 직원 ID 목록 조회 (deletedAt IS NULL인 것만)
- 전체 활성 직원 목록에서 등록된 직원 제외
- 부서 정보 포함하여 반환
- 직원명 기준 오름차순 정렬

**테스트 케이스:**
- 기본 조회: 등록되지 않은 모든 활성 직원 조회
- 빈 결과: 모든 직원이 등록된 경우 빈 배열 반환
- 직원 정보: 각 직원의 상세 정보 (이름, 부서, 직급, 이메일 등) 포함
- 정렬: 직원명 기준 오름차순 정렬
- 필터링: isExcludedFromList=false인 직원만 포함
- 존재하지 않는 평가기간: 유효하지 않은 평가기간 ID로 요청 시 404 에러
- 잘못된 UUID: UUID 형식이 올바르지 않을 때 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiOkResponse)({
    description: '등록되지 않은 직원 목록 조회 성공',
    type: evaluation_target_dto_1.UnregisteredEmployeesResponseDto,
}), (0, swagger_1.ApiNotFoundResponse)({
    description: '평가기간을 찾을 수 없음',
}), (0, swagger_1.ApiBadRequestResponse)({
    description: '잘못된 요청 (잘못된 UUID 형식)',
}));
exports.GetUnregisteredEmployees = GetUnregisteredEmployees;
const UnregisterEvaluationTarget = () => (0, common_1.applyDecorators)((0, common_1.Delete)(':evaluationPeriodId/targets/:employeeId'), (0, swagger_1.ApiOperation)({
    summary: '평가 대상자 등록 해제',
    description: `**중요**: 특정 평가기간에서 직원의 평가 대상자 등록을 해제합니다. 소프트 삭제로 동작하여 데이터는 보존되지만 조회되지 않습니다.

**테스트 케이스:**
- 기본 해제: 등록된 평가 대상자를 성공적으로 해제 처리
- 성공 응답: 해제 후 success: true 반환
- 조회 제외: 해제 후 일반 조회 시 해당 맵핑이 조회되지 않음
- 소프트 삭제: deletedAt 필드가 설정되어 데이터는 DB에 보존됨
- 제외된 대상자 해제: 제외(isExcluded: true) 상태인 대상자도 해제 가능
- 등록되지 않은 대상자: 평가 대상자로 등록되지 않은 경우 404 에러
- 중복 해제: 이미 해제된 대상자를 다시 해제 시 404 에러
- 잘못된 평가기간 UUID: 형식이 올바르지 않은 평가기간 ID로 요청 시 400 에러
- 잘못된 직원 UUID: 형식이 올바르지 않은 직원 ID로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: String,
    example: '223e4567-e89b-12d3-a456-426614174001',
}), (0, swagger_1.ApiOkResponse)({
    description: '평가 대상자 등록 해제 성공',
    schema: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
        },
    },
}), (0, swagger_1.ApiNotFoundResponse)({ description: '평가 대상자를 찾을 수 없음' }));
exports.UnregisterEvaluationTarget = UnregisterEvaluationTarget;
const UnregisterAllEvaluationTargets = () => (0, common_1.applyDecorators)((0, common_1.Delete)(':evaluationPeriodId/targets'), (0, swagger_1.ApiOperation)({
    summary: '평가기간의 모든 대상자 등록 해제',
    description: `**중요**: 특정 평가기간의 모든 평가 대상자 등록을 한 번에 해제합니다. 소프트 삭제로 동작하며, 제외된 대상자도 포함하여 모두 해제됩니다.

**테스트 케이스:**
- 기본 전체 해제: 평가기간의 모든 대상자를 성공적으로 해제
- 해제 수 반환: 실제로 해제된 대상자 수가 deletedCount로 정확하게 반환됨
- 빈 평가기간: 대상자가 없는 경우 deletedCount: 0 반환
- 제외 상태 무관: 제외(isExcluded: true)된 대상자도 함께 해제됨
- 부분 해제 후 전체 해제: 일부 대상자가 이미 해제된 경우 나머지만 해제되고 정확한 수 반환
- 평가기간 격리: 다른 평가기간의 대상자는 영향받지 않음 (평가기간별로 독립적으로 동작)
- 존재하지 않는 평가기간: 평가기간 미존재 시 deletedCount: 0 반환
- 잘못된 평가기간 UUID: 형식이 올바르지 않은 평가기간 ID로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'evaluationPeriodId',
    description: '평가기간 ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
}), (0, swagger_1.ApiOkResponse)({
    description: '평가기간의 모든 대상자 등록 해제 성공',
    schema: {
        type: 'object',
        properties: {
            deletedCount: { type: 'number', example: 5 },
        },
    },
}));
exports.UnregisterAllEvaluationTargets = UnregisterAllEvaluationTargets;
//# sourceMappingURL=evaluation-target-api.decorators.js.map