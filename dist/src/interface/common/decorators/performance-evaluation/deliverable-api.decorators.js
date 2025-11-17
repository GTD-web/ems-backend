"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDeliverable = CreateDeliverable;
exports.UpdateDeliverable = UpdateDeliverable;
exports.DeleteDeliverable = DeleteDeliverable;
exports.BulkCreateDeliverables = BulkCreateDeliverables;
exports.BulkDeleteDeliverables = BulkDeleteDeliverables;
exports.GetEmployeeDeliverables = GetEmployeeDeliverables;
exports.GetWbsDeliverables = GetWbsDeliverables;
exports.GetDeliverableDetail = GetDeliverableDetail;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deliverable_dto_1 = require("../../dto/performance-evaluation/deliverable.dto");
function CreateDeliverable() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '산출물 생성',
        description: `직원에게 WBS 항목에 대한 산출물을 생성합니다.

**동작:**
- 산출물 생성 시 직원과 WBS 항목에 자동 매핑
- 활성 상태로 생성됨
- 파일 경로는 선택적으로 제공 가능

**테스트 케이스:**
- 기본 산출물을 생성할 수 있어야 한다
- 파일 경로를 포함하여 산출물을 생성할 수 있어야 한다
- 설명을 포함하여 산출물을 생성할 수 있어야 한다
- 잘못된 형식의 employeeId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 wbsItemId로 요청 시 400 에러가 발생해야 한다
- name 누락 시 400 에러가 발생해야 한다
- type 누락 시 400 에러가 발생해야 한다
- employeeId 누락 시 400 에러가 발생해야 한다
- wbsItemId 누락 시 400 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 생성된 산출물이 DB에 올바르게 저장되어야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: deliverable_dto_1.CreateDeliverableDto,
        description: '산출물 생성 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '산출물이 성공적으로 생성되었습니다.',
        type: deliverable_dto_1.DeliverableResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function UpdateDeliverable() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '산출물 수정',
        description: `산출물 정보를 수정합니다.

**동작:**
- 산출물명, 유형, 설명, 파일 경로 수정 가능
- 직원 또는 WBS 항목 재할당 가능
- 수정된 필드만 업데이트됨

**테스트 케이스:**
- 산출물명을 수정할 수 있어야 한다
- 산출물 유형을 수정할 수 있어야 한다
- 설명을 수정할 수 있어야 한다
- 파일 경로를 수정할 수 있어야 한다
- 직원을 재할당할 수 있어야 한다
- WBS 항목을 재할당할 수 있어야 한다
- 여러 필드를 동시에 수정할 수 있어야 한다
- 잘못된 형식의 id로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 id로 요청 시 404 에러가 발생해야 한다
- 응답에 수정된 정보가 반영되어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '산출물 ID',
        type: String,
        format: 'uuid',
    }), (0, swagger_1.ApiBody)({
        type: deliverable_dto_1.UpdateDeliverableDto,
        description: '수정할 산출물 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '산출물이 성공적으로 수정되었습니다.',
        type: deliverable_dto_1.DeliverableResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '산출물을 찾을 수 없습니다.',
    }));
}
function DeleteDeliverable() {
    return (0, common_1.applyDecorators)((0, common_1.Delete)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({
        summary: '산출물 삭제',
        description: `산출물을 삭제합니다 (소프트 삭제).

**동작:**
- 소프트 삭제 방식으로 deletedAt 타임스탬프 설정
- 실제 데이터는 DB에 유지됨
- 삭제된 산출물은 조회 시 제외됨

**테스트 케이스:**
- 산출물을 삭제할 수 있어야 한다
- 삭제된 산출물은 조회되지 않아야 한다
- 잘못된 형식의 id로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 id로 요청 시 404 에러가 발생해야 한다
- 삭제 후 deletedAt이 설정되어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '산출물 ID',
        type: String,
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: '산출물이 성공적으로 삭제되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '산출물을 찾을 수 없습니다.',
    }));
}
function BulkCreateDeliverables() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('bulk'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '산출물 벌크 생성',
        description: `여러 산출물을 한 번에 생성합니다.

**동작:**
- 여러 산출물을 한 번의 요청으로 생성
- 개별 산출물 생성 실패 시에도 나머지는 계속 처리
- 성공한 산출물의 ID 목록 반환
- 실패한 항목은 로그에 기록

**테스트 케이스:**
- 여러 산출물을 한 번에 생성할 수 있어야 한다
- 생성 성공한 산출물 ID 목록이 반환되어야 한다
- 빈 배열로 요청 시에도 처리되어야 한다
- 일부 항목 생성 실패 시 성공한 항목은 생성되어야 한다
- 잘못된 형식의 데이터 포함 시 해당 항목만 실패해야 한다
- 응답에 성공/실패 개수가 포함되어야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: deliverable_dto_1.BulkCreateDeliverablesDto,
        description: '생성할 산출물 목록',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '산출물이 성공적으로 생성되었습니다.',
        type: deliverable_dto_1.BulkCreateResultDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function BulkDeleteDeliverables() {
    return (0, common_1.applyDecorators)((0, common_1.Delete)('bulk'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '산출물 벌크 삭제',
        description: `여러 산출물을 한 번에 삭제합니다.

**동작:**
- 여러 산출물을 한 번의 요청으로 삭제
- 개별 산출물 삭제 실패 시에도 나머지는 계속 처리
- 성공/실패 개수 및 실패한 ID 목록 반환

**테스트 케이스:**
- 여러 산출물을 한 번에 삭제할 수 있어야 한다
- 성공/실패 개수가 정확하게 반환되어야 한다
- 실패한 산출물 ID 목록이 반환되어야 한다
- 빈 배열로 요청 시에도 처리되어야 한다
- 존재하지 않는 ID 포함 시 해당 항목만 실패해야 한다
- 잘못된 형식의 ID 포함 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: deliverable_dto_1.BulkDeleteDeliverablesDto,
        description: '삭제할 산출물 ID 목록',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '산출물이 삭제되었습니다.',
        type: deliverable_dto_1.BulkDeleteResultDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function GetEmployeeDeliverables() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('employee/:employeeId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '직원별 산출물 조회',
        description: `특정 직원의 산출물 목록을 조회합니다.

**동작:**
- 직원에게 할당된 모든 산출물 조회
- 활성 상태 필터링 가능
- 최신순으로 정렬

**테스트 케이스:**
- 직원의 산출물 목록을 조회할 수 있어야 한다
- activeOnly 파라미터로 활성 산출물만 조회할 수 있어야 한다
- activeOnly=false로 비활성 산출물도 조회할 수 있어야 한다
- activeOnly 생략 시 활성 산출물만 조회되어야 한다
- 산출물이 없는 직원도 빈 배열을 반환해야 한다
- 잘못된 형식의 employeeId로 요청 시 400 에러가 발생해야 한다
- 응답에 총 개수가 포함되어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID',
        type: String,
        format: 'uuid',
    }), (0, swagger_1.ApiQuery)({
        name: 'activeOnly',
        required: false,
        description: '활성 상태만 조회 (기본값: true, 가능값: "true", "false", "1", "0")',
        type: String,
        example: 'true',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '산출물 목록 조회 성공',
        type: deliverable_dto_1.DeliverableListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function GetWbsDeliverables() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('wbs/:wbsItemId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'WBS 항목별 산출물 조회',
        description: `특정 WBS 항목의 산출물 목록을 조회합니다.

**동작:**
- WBS 항목에 연결된 모든 산출물 조회
- 활성 상태 필터링 가능
- 최신순으로 정렬

**테스트 케이스:**
- WBS 항목의 산출물 목록을 조회할 수 있어야 한다
- activeOnly 파라미터로 활성 산출물만 조회할 수 있어야 한다
- activeOnly=false로 비활성 산출물도 조회할 수 있어야 한다
- activeOnly 생략 시 활성 산출물만 조회되어야 한다
- 산출물이 없는 WBS 항목도 빈 배열을 반환해야 한다
- 잘못된 형식의 wbsItemId로 요청 시 400 에러가 발생해야 한다
- 응답에 총 개수가 포함되어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'wbsItemId',
        description: 'WBS 항목 ID',
        type: String,
        format: 'uuid',
    }), (0, swagger_1.ApiQuery)({
        name: 'activeOnly',
        required: false,
        description: '활성 상태만 조회 (기본값: true, 가능값: "true", "false", "1", "0")',
        type: String,
        example: 'true',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '산출물 목록 조회 성공',
        type: deliverable_dto_1.DeliverableListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function GetDeliverableDetail() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '산출물 상세 조회',
        description: `산출물 상세 정보를 조회합니다.

**동작:**
- 산출물의 모든 정보 조회
- 매핑 정보(직원, WBS 항목) 포함
- 메타데이터(생성일, 수정일 등) 포함

**테스트 케이스:**
- 산출물 상세 정보를 조회할 수 있어야 한다
- 응답에 모든 필드가 포함되어야 한다
- 잘못된 형식의 id로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 id로 요청 시 404 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '산출물 ID',
        type: String,
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '산출물 상세 조회 성공',
        type: deliverable_dto_1.DeliverableResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '산출물을 찾을 수 없습니다.',
    }));
}
//# sourceMappingURL=deliverable-api.decorators.js.map