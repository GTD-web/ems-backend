"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchConfigureSecondaryEvaluator = exports.BatchConfigurePrimaryEvaluator = exports.GetPrimaryEvaluatorsByPeriod = exports.GetEvaluatorsByPeriod = exports.ConfigureSecondaryEvaluator = exports.ConfigurePrimaryEvaluator = exports.GetEmployeeEvaluationSettings = exports.ConfigureEmployeeWbsEvaluationLine = exports.GetEvaluatorEmployees = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_line_dto_1 = require("../../dto/evaluation-criteria/evaluation-line.dto");
const GetEvaluatorEmployees = () => (0, common_1.applyDecorators)((0, common_1.Get)('periods/:periodId/evaluators/:evaluatorId/employees'), (0, swagger_1.ApiOperation)({
    summary: '평가자별 피평가자 조회',
    description: `특정 평가기간에 특정 평가자가 평가해야 하는 피평가자 목록을 조회합니다.

**테스트 케이스:**
- 1차 평가자로 구성된 피평가자 목록 조회: WBS 할당 후 1차 평가자로 구성된 직원들의 목록을 성공적으로 조회 (200)
- 2차 평가자로 구성된 피평가자 목록 조회: WBS 할당 후 2차 평가자로 구성된 직원들의 목록을 성공적으로 조회 (200)
- 1차 및 2차 평가자 모두 구성된 경우: 서로 다른 직원에 대해 1차/2차 평가자로 구성된 모든 피평가자를 조회 (200)
- 평가자로 구성되지 않은 경우: 평가자로 등록되지 않은 직원 ID로 조회 시 빈 배열 반환 (200)
- WBS 항목 정보 포함: 각 피평가자의 WBS 항목 정보가 응답에 포함됨
- 존재하지 않는 평가자 ID: 유효한 UUID이지만 존재하지 않는 평가자 ID로 조회 시 빈 배열 반환 (200)
- 잘못된 UUID 형식 평가기간 ID: 잘못된 UUID 형식의 평가기간 ID로 조회 시 에러 발생 (400)
- 잘못된 UUID 형식 평가자 ID: 잘못된 UUID 형식의 평가자 ID로 조회 시 에러 발생 (400)
- 타임스탬프 형식 검증: 조회된 피평가자 정보의 createdAt, updatedAt이 올바른 Date 형식
- 중복 피평가자 처리: 같은 직원이 여러 WBS 항목에 대해 평가받는 경우 각각 반환됨`,
}), (0, swagger_1.ApiParam)({
    name: 'periodId',
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
}), (0, swagger_1.ApiParam)({
    name: 'evaluatorId',
    description: '평가자 ID',
    type: 'string',
    format: 'uuid',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
}), (0, swagger_1.ApiResponse)({
    status: 200,
    description: '평가자별 피평가자 목록이 성공적으로 조회되었습니다.',
    schema: {
        type: 'object',
        properties: {
            evaluatorId: { type: 'string', format: 'uuid' },
            employees: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        employeeId: { type: 'string', format: 'uuid' },
                        wbsItemId: { type: 'string', format: 'uuid' },
                        evaluationLineId: { type: 'string', format: 'uuid' },
                        createdBy: { type: 'string', format: 'uuid' },
                        updatedBy: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                    required: [
                        'employeeId',
                        'evaluationLineId',
                        'createdAt',
                        'updatedAt',
                    ],
                },
            },
        },
        required: ['evaluatorId', 'employees'],
    },
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 UUID 형식입니다.',
}), (0, swagger_1.ApiResponse)({
    status: 404,
    description: '평가자를 찾을 수 없습니다.',
}), (0, swagger_1.ApiResponse)({
    status: 500,
    description: '서버 내부 오류가 발생했습니다.',
}));
exports.GetEvaluatorEmployees = GetEvaluatorEmployees;
const ConfigureEmployeeWbsEvaluationLine = () => (0, common_1.applyDecorators)((0, common_1.Post)('employee/:employeeId/wbs/:wbsItemId/period/:periodId/configure'), (0, swagger_1.ApiOperation)({
    summary: '직원-WBS별 평가라인 구성',
    description: '특정 직원의 특정 WBS 항목에 대한 평가라인을 구성합니다.',
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: 'string',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
}), (0, swagger_1.ApiParam)({
    name: 'wbsItemId',
    description: 'WBS 항목 ID',
    type: 'string',
    format: 'uuid',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
}), (0, swagger_1.ApiParam)({
    name: 'periodId',
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
}), (0, swagger_1.ApiBody)({
    description: '평가라인 구성 데이터',
    schema: {
        type: 'object',
        properties: {
            createdBy: {
                type: 'string',
                format: 'uuid',
                description: '생성자 ID',
                example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
            },
        },
        required: [],
    },
}), (0, swagger_1.ApiResponse)({
    status: 201,
    description: '평가라인 구성이 성공적으로 완료되었습니다.',
    schema: {
        type: 'object',
        properties: {
            message: { type: 'string' },
            createdLines: { type: 'number' },
            createdMappings: { type: 'number' },
        },
    },
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 요청 데이터입니다.',
}), (0, swagger_1.ApiResponse)({
    status: 404,
    description: '직원, WBS 항목 또는 평가기간을 찾을 수 없습니다.',
}));
exports.ConfigureEmployeeWbsEvaluationLine = ConfigureEmployeeWbsEvaluationLine;
const GetEmployeeEvaluationSettings = () => (0, common_1.applyDecorators)((0, common_1.Get)('employee/:employeeId/period/:periodId/settings'), (0, swagger_1.ApiOperation)({
    summary: '직원 평가설정 통합 조회',
    description: `특정 직원의 특정 평가기간에 대한 모든 평가설정을 통합 조회합니다.

**테스트 케이스:**
- 프로젝트/WBS/평가라인 모두 있는 경우: 프로젝트 할당, WBS 할당, 평가라인 매핑이 모두 설정된 경우 전체 설정 조회 (200)
- 프로젝트만 할당된 경우: 프로젝트 할당만 있고 WBS 할당과 평가라인 매핑은 빈 배열 반환 (200)
- WBS만 할당된 경우: WBS 할당과 자동 생성된 평가라인 매핑 반환 (200)
- 할당이 없는 경우: 모든 배열(projectAssignments, wbsAssignments, evaluationLineMappings)이 빈 배열로 반환 (200)
- 여러 프로젝트/WBS 할당: 여러 프로젝트와 WBS가 할당된 경우 모든 할당 정보가 반환됨
- 선택적 필드 검증: deletedAt, createdBy, updatedBy 등 선택적 필드가 있으면 올바른 타입으로 반환됨
- 존재하지 않는 직원 ID: 유효한 UUID이지만 존재하지 않는 직원 ID로 조회 시 빈 배열들 반환 (200)
- 존재하지 않는 평가기간 ID: 유효한 UUID이지만 존재하지 않는 평가기간 ID로 조회 시 빈 배열들 반환 (200)
- 잘못된 UUID 형식 직원 ID: 잘못된 UUID 형식의 직원 ID로 조회 시 에러 발생 (400 또는 500)
- 잘못된 UUID 형식 평가기간 ID: 잘못된 UUID 형식의 평가기간 ID로 조회 시 에러 발생 (400 또는 500)
- 빈 문자열 직원 ID: 빈 문자열로 조회 시 에러 발생 (404 또는 500)
- 타임스탬프 형식 검증: 모든 타임스탬프 필드(assignedDate, createdAt, updatedAt)가 올바른 Date 형식
- 필수 필드 존재 확인: projectAssignments, wbsAssignments, evaluationLineMappings의 모든 필수 필드가 존재함`,
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: 'string',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
}), (0, swagger_1.ApiParam)({
    name: 'periodId',
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
}), (0, swagger_1.ApiResponse)({
    status: 200,
    description: '직원 평가설정이 성공적으로 조회되었습니다.',
    schema: {
        type: 'object',
        properties: {
            employeeId: { type: 'string', format: 'uuid' },
            periodId: { type: 'string', format: 'uuid' },
            projectAssignments: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        periodId: { type: 'string', format: 'uuid' },
                        employeeId: { type: 'string', format: 'uuid' },
                        projectId: { type: 'string', format: 'uuid' },
                        assignedDate: { type: 'string', format: 'date-time' },
                        assignedBy: { type: 'string', format: 'uuid' },
                        displayOrder: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        deletedAt: { type: 'string', format: 'date-time' },
                        createdBy: { type: 'string', format: 'uuid' },
                        updatedBy: { type: 'string', format: 'uuid' },
                        version: { type: 'number' },
                        periodName: { type: 'string' },
                        employeeName: { type: 'string' },
                        projectName: { type: 'string' },
                        assignedByName: { type: 'string' },
                    },
                    required: [
                        'id',
                        'periodId',
                        'employeeId',
                        'projectId',
                        'assignedDate',
                        'assignedBy',
                        'displayOrder',
                        'createdAt',
                        'updatedAt',
                        'version',
                    ],
                },
            },
            wbsAssignments: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        periodId: { type: 'string', format: 'uuid' },
                        employeeId: { type: 'string', format: 'uuid' },
                        projectId: { type: 'string', format: 'uuid' },
                        wbsItemId: { type: 'string', format: 'uuid' },
                        assignedDate: { type: 'string', format: 'date-time' },
                        assignedBy: { type: 'string', format: 'uuid' },
                        displayOrder: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        deletedAt: { type: 'string', format: 'date-time' },
                        createdBy: { type: 'string', format: 'uuid' },
                        updatedBy: { type: 'string', format: 'uuid' },
                        version: { type: 'number' },
                        periodName: { type: 'string' },
                        employeeName: { type: 'string' },
                        projectName: { type: 'string' },
                        wbsItemTitle: { type: 'string' },
                        wbsItemCode: { type: 'string' },
                        assignedByName: { type: 'string' },
                    },
                    required: [
                        'id',
                        'periodId',
                        'employeeId',
                        'projectId',
                        'wbsItemId',
                        'assignedDate',
                        'assignedBy',
                        'displayOrder',
                        'createdAt',
                        'updatedAt',
                        'version',
                    ],
                },
            },
            evaluationLineMappings: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        employeeId: { type: 'string', format: 'uuid' },
                        evaluatorId: { type: 'string', format: 'uuid' },
                        wbsItemId: { type: 'string', format: 'uuid' },
                        evaluationLineId: { type: 'string', format: 'uuid' },
                        createdBy: { type: 'string', format: 'uuid' },
                        updatedBy: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                    required: [
                        'id',
                        'employeeId',
                        'evaluatorId',
                        'evaluationLineId',
                        'createdAt',
                        'updatedAt',
                    ],
                },
            },
        },
        required: [
            'employeeId',
            'periodId',
            'projectAssignments',
            'wbsAssignments',
            'evaluationLineMappings',
        ],
    },
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 UUID 형식입니다.',
}), (0, swagger_1.ApiResponse)({
    status: 404,
    description: '직원 또는 평가기간을 찾을 수 없습니다.',
}), (0, swagger_1.ApiResponse)({
    status: 500,
    description: '서버 내부 오류가 발생했습니다.',
}));
exports.GetEmployeeEvaluationSettings = GetEmployeeEvaluationSettings;
const ConfigurePrimaryEvaluator = () => (0, common_1.applyDecorators)((0, common_1.Post)('employee/:employeeId/period/:periodId/primary-evaluator'), (0, swagger_1.ApiOperation)({
    summary: '1차 평가자 구성 (직원별 고정 담당자)',
    description: `특정 직원의 1차 평가자(고정 담당자)를 구성합니다.

**동작 방식:**
- 직원별로 고정된 1차 평가자 설정 (WBS와 무관)
- 기존 1차 평가자가 있는 경우: 평가자 업데이트
- 1차 평가자가 없는 경우: 새로운 평가라인 및 매핑 생성
- Upsert 방식으로 동작하여 중복 생성 방지

**테스트 케이스:**
- 직원별 1차 평가자 설정: 특정 직원의 고정 담당자를 1차 평가자로 설정 (201)
- 기존 1차 평가자 업데이트: 이미 설정된 1차 평가자를 다른 평가자로 변경 (201)
- DB 업데이트 확인: 업데이트된 매핑 정보가 DB에 정상적으로 저장됨
- 여러 직원 설정: 서로 다른 직원의 1차 평가자를 각각 설정 가능
- 잘못된 UUID 형식 evaluatorId: 잘못된 UUID 형식의 evaluatorId로 요청 시 400 에러
- evaluatorId 누락: evaluatorId가 누락된 경우 400 에러
- 잘못된 UUID 형식 직원 ID: 잘못된 UUID 형식의 employeeId로 요청 시 400 에러
- 잘못된 UUID 형식 평가기간 ID: 잘못된 UUID 형식의 periodId로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: 'string',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
}), (0, swagger_1.ApiParam)({
    name: 'periodId',
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
}), (0, swagger_1.ApiBody)({
    type: evaluation_line_dto_1.ConfigurePrimaryEvaluatorDto,
    description: '1차 평가자 구성 데이터',
}), (0, swagger_1.ApiResponse)({
    status: 201,
    description: '1차 평가자 구성이 성공적으로 완료되었습니다.',
    schema: {
        type: 'object',
        properties: {
            message: { type: 'string' },
            createdLines: { type: 'number' },
            createdMappings: { type: 'number' },
            mapping: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    employeeId: { type: 'string', format: 'uuid' },
                    evaluatorId: { type: 'string', format: 'uuid' },
                    wbsItemId: { type: 'string', format: 'uuid', nullable: true },
                    evaluationLineId: { type: 'string', format: 'uuid' },
                },
            },
        },
    },
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 요청 데이터입니다.',
}), (0, swagger_1.ApiResponse)({
    status: 404,
    description: '직원 또는 평가기간을 찾을 수 없습니다.',
}));
exports.ConfigurePrimaryEvaluator = ConfigurePrimaryEvaluator;
const ConfigureSecondaryEvaluator = () => (0, common_1.applyDecorators)((0, common_1.Post)('employee/:employeeId/wbs/:wbsItemId/period/:periodId/secondary-evaluator'), (0, swagger_1.ApiOperation)({
    summary: '2차 평가자 구성 (Upsert)',
    description: `특정 직원의 특정 WBS 항목에 대한 2차 평가자를 구성합니다.

**동작 방식:**
- WBS 할당 시 자동으로 생성된 평가라인이 있는 경우: 평가자 업데이트
- 평가라인이 없는 경우: 새로운 평가라인 및 매핑 생성
- Upsert 방식으로 동작하여 중복 생성 방지

**테스트 케이스:**
- WBS 할당 시 자동 생성된 2차 평가자 업데이트: WBS 할당으로 자동 생성된 평가라인의 평가자를 새로운 평가자로 변경 (201)
- DB 업데이트 확인: 업데이트된 매핑 정보가 DB에 정상적으로 저장됨
- 1차/2차 평가자 함께 업데이트: 동일 직원의 1차 평가자와 2차 평가자를 연속으로 업데이트 가능
- 잘못된 UUID 형식 evaluatorId: 잘못된 UUID 형식의 evaluatorId로 요청 시 400 에러
- evaluatorId 누락: evaluatorId가 누락된 경우 400 에러
- 잘못된 UUID 형식 직원 ID: 잘못된 UUID 형식의 employeeId로 요청 시 400 에러
- 잘못된 UUID 형식 WBS ID: 잘못된 UUID 형식의 wbsItemId로 요청 시 400 에러`,
}), (0, swagger_1.ApiParam)({
    name: 'employeeId',
    description: '직원 ID',
    type: 'string',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
}), (0, swagger_1.ApiParam)({
    name: 'wbsItemId',
    description: 'WBS 항목 ID',
    type: 'string',
    format: 'uuid',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
}), (0, swagger_1.ApiParam)({
    name: 'periodId',
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
}), (0, swagger_1.ApiBody)({
    type: evaluation_line_dto_1.ConfigureSecondaryEvaluatorDto,
    description: '2차 평가자 구성 데이터',
}), (0, swagger_1.ApiResponse)({
    status: 201,
    description: '2차 평가자 구성이 성공적으로 완료되었습니다.',
    schema: {
        type: 'object',
        properties: {
            message: { type: 'string' },
            createdLines: { type: 'number' },
            createdMappings: { type: 'number' },
            mapping: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    employeeId: { type: 'string', format: 'uuid' },
                    evaluatorId: { type: 'string', format: 'uuid' },
                    wbsItemId: { type: 'string', format: 'uuid' },
                    evaluationLineId: { type: 'string', format: 'uuid' },
                },
            },
        },
    },
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 요청 데이터입니다.',
}), (0, swagger_1.ApiResponse)({
    status: 404,
    description: '직원, WBS 항목 또는 평가기간을 찾을 수 없습니다.',
}));
exports.ConfigureSecondaryEvaluator = ConfigureSecondaryEvaluator;
const GetEvaluatorsByPeriod = () => (0, common_1.applyDecorators)((0, common_1.Get)('period/:periodId/evaluators'), (0, swagger_1.ApiOperation)({
    summary: '평가기간별 평가자 목록 조회',
    description: `특정 평가기간에서 평가자로 지정된 직원 목록을 조회합니다.

**동작:**
- 해당 평가기간의 WBS 할당 중 평가자로 지정된 직원 목록 반환
- 쿼리 파라미터로 1차/2차/전체 평가자 선택 가능 (기본값: all)
- 각 평가자가 담당하는 피평가자 수 포함
- 직원 기본 정보 포함 (이름, 부서명)
- 동일 직원이 1차/2차 평가자 역할을 모두 하는 경우 각각 별도 항목으로 반환

**테스트 케이스:**
- 기본 조회 (type=all): 평가기간의 모든 평가자 목록을 조회 (200)
- type 파라미터 생략: 기본값(all)로 동작하여 모든 평가자 조회 (200)
- 1차 평가자만 조회 (type=primary): 1차 평가자만 반환됨 (200)
- 2차 평가자만 조회 (type=secondary): 2차 평가자만 반환됨 (200)
- 피평가자 수 정확도: 동일 평가자에게 3명 할당 시 evaluateeCount가 3으로 반환됨
- 직원 정보 포함: 평가자의 이름(evaluatorName), 부서명(departmentName) 포함
- 평가자 유형 포함: 각 평가자의 유형(primary/secondary) 포함
- 동일 직원 이중 역할: 같은 직원이 1차/2차 평가자 역할을 모두 하는 경우 2개 항목으로 반환됨
- 평가자가 없는 경우: 빈 배열 반환 (200)
- 존재하지 않는 평가기간: 유효한 UUID이지만 존재하지 않는 평가기간 ID로 조회 시 빈 배열 반환 (200)
- 잘못된 UUID 형식: 잘못된 UUID 형식의 평가기간 ID로 조회 시 400 에러
- 잘못된 type 값: 유효하지 않은 type 값(예: 'invalid-type')으로 조회 시 400 에러
- type=primary 필터링 정확도: type=primary일 때 secondary 평가자가 절대 포함되지 않음
- type=secondary 필터링 정확도: type=secondary일 때 primary 평가자가 절대 포함되지 않음
- 필수 필드 존재: periodId, type, evaluators 필드가 항상 존재
- 평가자 필수 필드: evaluatorId, evaluatorName, departmentName, evaluatorType, evaluateeCount 필드 존재`,
}), (0, swagger_1.ApiParam)({
    name: 'periodId',
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
}), (0, swagger_1.ApiQuery)({
    name: 'type',
    required: false,
    description: '평가자 유형 (primary: 1차만, secondary: 2차만, all: 전체, 기본값: all)',
    enum: ['primary', 'secondary', 'all'],
    example: 'all',
}), (0, swagger_1.ApiResponse)({
    status: 200,
    description: '평가자 목록이 성공적으로 조회되었습니다.',
    schema: {
        type: 'object',
        properties: {
            periodId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['primary', 'secondary', 'all'] },
            evaluators: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        evaluatorId: { type: 'string', format: 'uuid' },
                        evaluatorName: { type: 'string' },
                        departmentName: { type: 'string' },
                        evaluatorType: {
                            type: 'string',
                            enum: ['primary', 'secondary'],
                        },
                        evaluateeCount: { type: 'number' },
                    },
                },
            },
        },
    },
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 요청입니다.',
}));
exports.GetEvaluatorsByPeriod = GetEvaluatorsByPeriod;
exports.GetPrimaryEvaluatorsByPeriod = exports.GetEvaluatorsByPeriod;
const BatchConfigurePrimaryEvaluator = () => (0, common_1.applyDecorators)((0, common_1.Post)('period/:periodId/batch-primary-evaluator'), (0, swagger_1.ApiOperation)({
    summary: '여러 피평가자의 1차 평가자 일괄 구성',
    description: `여러 피평가자의 1차 평가자(고정 담당자)를 일괄로 구성합니다.

**동작:**
- 여러 직원의 1차 평가자를 한 번에 설정
- 각 직원별로 고정된 1차 평가자 설정 (WBS와 무관)
- 기존 1차 평가자가 있는 경우: 평가자 업데이트
- 1차 평가자가 없는 경우: 새로운 평가라인 및 매핑 생성
- Upsert 방식으로 동작하여 중복 생성 방지
- 일부 실패 시에도 성공한 항목은 처리됨

**테스트 케이스:**
- 여러 직원의 1차 평가자 일괄 설정: 여러 직원의 1차 평가자를 한 번에 설정 (201)
- 기존 1차 평가자 일괄 업데이트: 이미 설정된 여러 직원의 1차 평가자를 한 번에 변경 (201)
- 혼합 처리: 새로 설정하는 직원과 업데이트하는 직원을 함께 처리 (201)
- 일부 실패 처리: 일부 직원 ID가 유효하지 않아도 성공한 항목은 처리됨
- 빈 배열 처리: assignments가 빈 배열인 경우 0건 처리 완료 (201)
- 잘못된 UUID 형식 periodId: 잘못된 UUID 형식의 periodId로 요청 시 400 에러
- 잘못된 UUID 형식 employeeId: assignments 배열에 잘못된 UUID 형식의 employeeId가 포함된 경우 400 에러
- 잘못된 UUID 형식 evaluatorId: assignments 배열에 잘못된 UUID 형식의 evaluatorId가 포함된 경우 400 에러
- assignments 누락: assignments 필드가 누락된 경우 400 에러
- 존재하지 않는 직원 ID: 유효한 UUID이지만 존재하지 않는 직원 ID가 포함된 경우 해당 항목 실패`,
}), (0, swagger_1.ApiParam)({
    name: 'periodId',
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
}), (0, swagger_1.ApiBody)({
    type: evaluation_line_dto_1.BatchConfigurePrimaryEvaluatorDto,
    description: '배치 1차 평가자 구성 데이터',
}), (0, swagger_1.ApiResponse)({
    status: 201,
    description: '배치 1차 평가자 구성이 성공적으로 완료되었습니다.',
    type: evaluation_line_dto_1.BatchConfigurePrimaryEvaluatorResponseDto,
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 요청 데이터입니다.',
}), (0, swagger_1.ApiResponse)({
    status: 404,
    description: '평가기간을 찾을 수 없습니다.',
}));
exports.BatchConfigurePrimaryEvaluator = BatchConfigurePrimaryEvaluator;
const BatchConfigureSecondaryEvaluator = () => (0, common_1.applyDecorators)((0, common_1.Post)('period/:periodId/batch-secondary-evaluator'), (0, swagger_1.ApiOperation)({
    summary: '여러 피평가자의 2차 평가자 일괄 구성',
    description: `여러 피평가자의 WBS 항목별 2차 평가자를 일괄로 구성합니다.

**동작:**
- 여러 직원의 여러 WBS 항목에 대한 2차 평가자를 한 번에 설정
- WBS 할당 시 자동으로 생성된 평가라인이 있는 경우: 평가자 업데이트
- 평가라인이 없는 경우: 새로운 평가라인 및 매핑 생성
- WBS별로 한 명의 2차 평가자만 허용 (기존 매핑 자동 삭제 후 새 매핑 생성)
- Upsert 방식으로 동작하여 중복 생성 방지
- 일부 실패 시에도 성공한 항목은 처리됨

**테스트 케이스:**
- 여러 직원의 여러 WBS 항목에 대한 2차 평가자 일괄 설정: 여러 직원의 여러 WBS에 대한 2차 평가자를 한 번에 설정 (201)
- 기존 2차 평가자 일괄 업데이트: 이미 설정된 여러 직원의 여러 WBS에 대한 2차 평가자를 한 번에 변경 (201)
- 혼합 처리: 새로 설정하는 항목과 업데이트하는 항목을 함께 처리 (201)
- WBS별 유일성 보장: 동일 직원의 동일 WBS에 기존 2차 평가자가 있으면 기존 매핑 삭제 후 새 매핑 생성 (201)
- 일부 실패 처리: 일부 항목이 유효하지 않아도 성공한 항목은 처리됨
- 빈 배열 처리: assignments가 빈 배열인 경우 0건 처리 완료 (201)
- 잘못된 UUID 형식 periodId: 잘못된 UUID 형식의 periodId로 요청 시 400 에러
- 잘못된 UUID 형식 employeeId: assignments 배열에 잘못된 UUID 형식의 employeeId가 포함된 경우 400 에러
- 잘못된 UUID 형식 wbsItemId: assignments 배열에 잘못된 UUID 형식의 wbsItemId가 포함된 경우 400 에러
- 잘못된 UUID 형식 evaluatorId: assignments 배열에 잘못된 UUID 형식의 evaluatorId가 포함된 경우 400 에러
- assignments 누락: assignments 필드가 누락된 경우 400 에러
- 존재하지 않는 직원 ID: 유효한 UUID이지만 존재하지 않는 직원 ID가 포함된 경우 해당 항목 실패
- 존재하지 않는 WBS 항목 ID: 유효한 UUID이지만 존재하지 않는 WBS 항목 ID가 포함된 경우 해당 항목 실패`,
}), (0, swagger_1.ApiParam)({
    name: 'periodId',
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
}), (0, swagger_1.ApiBody)({
    type: evaluation_line_dto_1.BatchConfigureSecondaryEvaluatorDto,
    description: '배치 2차 평가자 구성 데이터',
}), (0, swagger_1.ApiResponse)({
    status: 201,
    description: '배치 2차 평가자 구성이 성공적으로 완료되었습니다.',
    type: evaluation_line_dto_1.BatchConfigureSecondaryEvaluatorResponseDto,
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 요청 데이터입니다.',
}), (0, swagger_1.ApiResponse)({
    status: 404,
    description: '평가기간을 찾을 수 없습니다.',
}));
exports.BatchConfigureSecondaryEvaluator = BatchConfigureSecondaryEvaluator;
//# sourceMappingURL=evaluation-line-api.decorators.js.map