"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProject = CreateProject;
exports.GetProjectList = GetProjectList;
exports.GetProjectDetail = GetProjectDetail;
exports.UpdateProject = UpdateProject;
exports.DeleteProject = DeleteProject;
exports.GetProjectManagers = GetProjectManagers;
exports.SetSecondaryEvaluators = SetSecondaryEvaluators;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const project_dto_1 = require("../../dto/project/project.dto");
function CreateProject() {
    return (0, common_1.applyDecorators)((0, common_2.Post)(), (0, common_2.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 생성',
        description: `새로운 프로젝트를 생성합니다.

**동작:**
- 프로젝트 기본 정보를 등록합니다
- 프로젝트 매니저(PM)를 설정할 수 있습니다
- 프로젝트 코드 중복을 검사합니다
- 생성자 정보를 자동으로 기록합니다

**테스트 케이스:**
- 기본 생성: 필수 정보만으로 프로젝트 생성
- PM 포함 생성: 프로젝트 매니저를 지정하여 생성
- 프로젝트 코드 포함: 프로젝트 코드를 포함하여 생성
- 날짜 정보 포함: 시작일과 종료일을 포함하여 생성
- 프로젝트 코드 중복: 이미 존재하는 프로젝트 코드 사용 시 400 에러
- 필수 필드 누락: name 누락 시 400 에러
- 잘못된 상태 값: 유효하지 않은 status 값 입력 시 400 에러
- 잘못된 매니저 ID: UUID 형식이 아닌 managerId 입력 시 400 에러`,
    }), (0, swagger_1.ApiBody)({ type: project_dto_1.CreateProjectDto }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '프로젝트가 성공적으로 생성되었습니다.',
        type: project_dto_1.ProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function GetProjectList() {
    return (0, common_1.applyDecorators)((0, common_2.Get)(), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 목록 조회',
        description: `프로젝트 목록을 페이징과 필터링을 통해 조회합니다.

**동작:**
- 페이징을 지원하여 대량의 프로젝트를 효율적으로 조회합니다
- 다양한 필터 조건으로 프로젝트를 검색할 수 있습니다
- 정렬 기준과 방향을 지정할 수 있습니다
- 소프트 삭제된 프로젝트는 제외됩니다

**테스트 케이스:**
- 기본 목록 조회: 기본 페이징 설정으로 프로젝트 목록 조회
- 페이징 적용: 특정 페이지와 항목 수 지정
- 상태 필터: 특정 상태의 프로젝트만 조회
- 매니저 필터: 특정 매니저의 프로젝트만 조회
- 날짜 범위 필터: 시작일/종료일 범위로 필터링
- 정렬 옵션: 다양한 정렬 기준과 방향 적용
- 빈 결과: 조건에 맞는 프로젝트가 없는 경우 빈 배열 반환`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트 목록이 성공적으로 조회되었습니다.',
        type: project_dto_1.ProjectListResponseDto,
    }));
}
function GetProjectDetail() {
    return (0, common_1.applyDecorators)((0, common_2.Get)(':id'), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 상세 조회',
        description: `특정 프로젝트의 상세 정보를 조회합니다.

**동작:**
- 프로젝트 ID로 상세 정보를 조회합니다
- 매니저 정보를 포함하여 반환합니다
- 삭제된 프로젝트는 조회되지 않습니다

**테스트 케이스:**
- 기본 조회: 유효한 프로젝트 ID로 상세 정보 조회
- 존재하지 않는 프로젝트: 유효하지 않은 ID로 조회 시 404 에러
- 잘못된 UUID 형식: UUID 형식이 아닌 ID 입력 시 400 에러
- 삭제된 프로젝트: 삭제된 프로젝트 조회 시 404 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트 상세 정보가 성공적으로 조회되었습니다.',
        type: project_dto_1.ProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '프로젝트를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 UUID 형식입니다.',
    }));
}
function UpdateProject() {
    return (0, common_1.applyDecorators)((0, common_2.Put)(':id'), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 수정',
        description: `기존 프로젝트의 정보를 수정합니다.

**동작:**
- 프로젝트 기본 정보를 수정합니다
- 프로젝트 매니저를 변경할 수 있습니다
- 프로젝트 코드 변경 시 중복을 검사합니다
- 수정자 정보를 자동으로 기록합니다

**테스트 케이스:**
- 기본 수정: 프로젝트명 등 기본 정보 수정
- PM 변경: 프로젝트 매니저 변경
- 상태 변경: 프로젝트 상태 변경 (ACTIVE → COMPLETED 등)
- 날짜 정보 수정: 시작일, 종료일 수정
- 부분 수정: 일부 필드만 수정
- 프로젝트 코드 중복: 다른 프로젝트의 코드로 변경 시 400 에러
- 존재하지 않는 프로젝트: 유효하지 않은 ID로 수정 시 404 에러
- 잘못된 데이터: 유효하지 않은 필드 값 입력 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiBody)({ type: project_dto_1.UpdateProjectDto }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트가 성공적으로 수정되었습니다.',
        type: project_dto_1.ProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '프로젝트를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function DeleteProject() {
    return (0, common_1.applyDecorators)((0, common_2.Delete)(':id'), (0, common_2.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 삭제',
        description: `프로젝트를 소프트 삭제합니다.

**동작:**
- 프로젝트를 소프트 삭제 처리합니다
- 삭제된 프로젝트는 목록 조회에서 제외됩니다
- 삭제자 정보를 자동으로 기록합니다
- 실제 데이터는 유지되어 복구 가능합니다

**테스트 케이스:**
- 기본 삭제: 유효한 프로젝트 ID로 삭제
- 삭제 후 조회: 삭제된 프로젝트 조회 시 404 에러
- 삭제 후 목록: 삭제된 프로젝트가 목록에서 제외됨
- 존재하지 않는 프로젝트: 유효하지 않은 ID로 삭제 시 404 에러
- 이미 삭제된 프로젝트: 이미 삭제된 프로젝트 삭제 시 404 에러
- 잘못된 UUID 형식: UUID 형식이 아닌 ID 입력 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: '프로젝트가 성공적으로 삭제되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '프로젝트를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 UUID 형식입니다.',
    }));
}
function GetProjectManagers() {
    return (0, common_1.applyDecorators)((0, common_2.Get)('managers'), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'PM(프로젝트 매니저) 목록 조회',
        description: `SSO에서 PM으로 지정 가능한 직원 목록을 조회합니다.

**동작:**
- SSO 서비스에서 전체 직원 정보를 조회합니다
- 관리 권한이 있는 직원들을 필터링합니다
- 부서, 직책, 직급 정보를 포함하여 반환합니다
- 검색어로 이름, 사번, 이메일 필터링이 가능합니다
- 부서 ID로 특정 부서의 PM만 조회 가능합니다

**테스트 케이스:**
- 전체 PM 목록 조회: 필터 없이 모든 PM 목록 조회
- 부서별 PM 조회: 특정 부서의 PM만 조회
- 검색어로 필터링: 이름, 사번, 이메일로 검색
- 관리 권한 보유자만 조회: hasManagementAuthority가 true인 직원만 포함
- 빈 결과: 조건에 맞는 PM이 없는 경우 빈 배열 반환`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'PM 목록이 성공적으로 조회되었습니다.',
        type: project_dto_1.ProjectManagerListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.SERVICE_UNAVAILABLE,
        description: 'SSO 서비스 연결 실패',
    }));
}
function SetSecondaryEvaluators() {
    return (0, common_1.applyDecorators)((0, common_2.Post)(':id/secondary-evaluators'), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 2차 평가자 설정',
        description: `프로젝트의 2차 평가자로 설정 가능한 직원들을 지정합니다.

**동작:**
- 프로젝트에 2차 평가자 목록을 설정합니다
- 기존 2차 평가자 목록은 새 목록으로 완전히 대체됩니다
- 빈 배열로 설정하면 모든 2차 평가자가 제거됩니다
- 설정된 2차 평가자는 프로젝트 조회 시 포함됩니다

**테스트 케이스:**
- 기본 설정: 여러 명의 2차 평가자 설정
- 단일 평가자 설정: 한 명의 2차 평가자만 설정
- 전체 교체: 기존 2차 평가자를 새 목록으로 완전히 교체
- 전체 삭제: 빈 배열로 설정하여 모든 2차 평가자 제거
- 존재하지 않는 프로젝트: 유효하지 않은 프로젝트 ID로 설정 시 404 에러
- 잘못된 UUID 형식: UUID 형식이 아닌 평가자 ID 입력 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiBody)({ type: project_dto_1.SetSecondaryEvaluatorsDto }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '2차 평가자가 성공적으로 설정되었습니다.',
        type: project_dto_1.SetSecondaryEvaluatorsResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '프로젝트를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
//# sourceMappingURL=project-api.decorators.js.map