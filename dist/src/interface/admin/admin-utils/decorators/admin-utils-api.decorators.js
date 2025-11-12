"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllProjects = GetAllProjects;
exports.ResetAllWbsEvaluationCriteria = ResetAllWbsEvaluationCriteria;
exports.ResetAllDeliverables = ResetAllDeliverables;
exports.ResetAllProjectAssignments = ResetAllProjectAssignments;
exports.ResetAllEvaluationLines = ResetAllEvaluationLines;
exports.ResetAllSelfEvaluations = ResetAllSelfEvaluations;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
function GetAllProjects() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('projects/all'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '전체 프로젝트 목록 조회',
        description: `모든 프로젝트 목록을 조회합니다. 평가기간 ID나 다른 필터 없이 시스템에 등록된 모든 프로젝트를 반환합니다.

**동작:**
- 삭제되지 않은 모든 프로젝트 조회
- 프로젝트명 기준 오름차순 정렬
- 페이징 및 필터링 없이 전체 목록 반환

**사용 사례:**
- 시스템에 등록된 전체 프로젝트 확인
- 프로젝트 선택을 위한 목록 제공
- 데이터 검증 및 관리

**테스트 케이스:**
- 기본 조회: 모든 프로젝트 목록 조회 성공
- 빈 결과: 프로젝트가 없을 때 빈 배열 반환
- 프로젝트 정보: ID, 이름, 코드, 매니저ID, 시작일, 종료일, 상태 등 포함
- 정렬 순서: 프로젝트명 기준 오름차순 정렬
- 삭제된 프로젝트 제외: 소프트 삭제된 프로젝트는 목록에서 제외`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '전체 프로젝트 목록이 성공적으로 조회되었습니다.',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    projectCode: { type: 'string' },
                    description: { type: 'string' },
                    managerId: { type: 'string', format: 'uuid' },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    status: {
                        type: 'string',
                        enum: ['ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED'],
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류',
    }));
}
function ResetAllWbsEvaluationCriteria() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('wbs-evaluation-criteria/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '모든 WBS 평가기준 리셋',
        description: `⚠️ **주의**: 시스템의 모든 WBS 평가기준을 한 번에 리셋합니다 (소프트 삭제).

**동작:**
- 모든 WBS 평가기준을 소프트 삭제 방식으로 삭제
- 실제 데이터는 DB에 유지됨 (deletedAt 설정)
- 삭제된 평가기준은 조회 시 제외됨
- id나 body 값 입력 없이 바로 리셋

**사용 사례:**
- 개발/테스트 환경에서 데이터 초기화
- 시스템 전체 평가기준 재설정
- 평가 시스템 리셋

**테스트 케이스:**
- 여러 평가기준이 있을 때 모두 리셋: 모든 평가기준이 성공적으로 리셋됨
- DB soft delete 확인: deletedAt이 설정되고 활성 평가기준이 없음
- 목록 조회 결과: 리셋 후 빈 배열 반환
- 평가기준 없는 경우: 평가기준이 없어도 성공 반환
- 중복 리셋 허용: 이미 리셋된 평가기준을 다시 리셋해도 에러 없음
- 재생성 가능: 리셋 후 새로운 평가기준 생성 가능`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '모든 WBS 평가기준이 리셋되었습니다.',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: '리셋 성공 여부' },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류',
    }));
}
function ResetAllDeliverables() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('deliverables/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '모든 산출물 리셋',
        description: `⚠️ **주의**: 시스템의 모든 산출물을 한 번에 리셋합니다 (소프트 삭제).

**동작:**
- 모든 산출물을 소프트 삭제 방식으로 삭제
- 실제 데이터는 DB에 유지됨 (deletedAt 설정)
- 삭제된 산출물은 조회 시 제외됨
- 성공/실패 개수 및 실패한 ID 목록 반환

**사용 사례:**
- 개발/테스트 환경에서 데이터 초기화
- 시스템 전체 산출물 재설정
- 대량 데이터 정리

**테스트 케이스:**
- 여러 산출물이 있을 때 모두 리셋할 수 있어야 한다
- 성공/실패 개수가 정확하게 반환되어야 한다
- 실패한 산출물 ID 목록이 반환되어야 한다
- 삭제된 산출물은 조회 시 제외되어야 한다
- 산출물이 없을 때도 정상 처리되어야 한다
- 리셋 후 새로운 산출물 생성 및 조회가 가능해야 한다`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '모든 산출물이 리셋되었습니다.',
        schema: {
            type: 'object',
            properties: {
                successCount: {
                    type: 'number',
                    description: '리셋 성공 개수',
                },
                failedCount: {
                    type: 'number',
                    description: '리셋 실패 개수',
                },
                failedIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '리셋 실패한 산출물 ID 목록',
                },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류',
    }));
}
function ResetAllProjectAssignments() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('project-assignments/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '모든 프로젝트 할당 리셋',
        description: `⚠️ **위험**: 모든 평가기간의 모든 프로젝트 할당 및 관련 평가 데이터를 완전히 리셋합니다. 이 작업은 되돌릴 수 없습니다.

**리셋되는 데이터:**
- 동료평가 질문 매핑
- 동료평가
- 하향평가
- 자기평가
- 산출물 매핑
- WBS 할당
- 평가라인 매핑
- 프로젝트 할당

**동작:**
- 모든 삭제는 하나의 트랜잭션으로 처리되어 원자성 보장
- 소프트 삭제 방식으로 deletedAt 필드 업데이트
- 삭제된 데이터는 목록 조회에서 자동 제외

**사용 사례:**
- 개발/테스트 환경에서 데이터 초기화
- 시스템 전체 데이터 재설정
- 마이그레이션 전 데이터 정리

**테스트 케이스:**
- 여러 할당이 있을 때 모두 리셋할 수 있어야 한다
- 트랜잭션 보장: 중간에 오류 발생 시 전체 롤백
- 목록 제외: 리셋 후 모든 할당이 목록에서 제외됨
- 빈 데이터: 할당이 없을 때 성공 반환
- 캐스케이드 삭제: 연관된 모든 데이터가 올바른 순서로 삭제됨
- 리셋 후 새로운 할당 생성 및 조회가 가능해야 한다`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '모든 프로젝트 할당 데이터가 성공적으로 리셋되었습니다.',
        schema: {
            type: 'object',
            properties: {
                deletedCounts: {
                    type: 'object',
                    description: '각 엔티티별 삭제 개수',
                    properties: {
                        peerEvaluationQuestionMappings: { type: 'number' },
                        peerEvaluations: { type: 'number' },
                        downwardEvaluations: { type: 'number' },
                        selfEvaluations: { type: 'number' },
                        wbsAssignments: { type: 'number' },
                        projectAssignments: { type: 'number' },
                        evaluationLineMappings: { type: 'number' },
                        deliverableMappings: { type: 'number' },
                    },
                },
                message: { type: 'string', description: '리셋 결과 메시지' },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ResetAllEvaluationLines() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('evaluation-lines/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '모든 평가라인 리셋',
        description: `⚠️ **위험**: 모든 평가라인 매핑 및 관련 평가 데이터를 완전히 리셋합니다. 이 작업은 되돌릴 수 없습니다.

**리셋되는 데이터:**
- 동료평가 질문 매핑
- 동료평가
- 하향평가
- 평가라인 매핑

**동작:**
- 모든 삭제는 하나의 트랜잭션으로 처리되어 원자성 보장
- 소프트 삭제 방식으로 deletedAt 필드 업데이트
- 삭제된 데이터는 목록 조회에서 자동 제외

**사용 사례:**
- 개발/테스트 환경에서 평가라인 데이터 초기화
- 평가라인 재설정
- 평가 시스템 리셋

**테스트 케이스:**
- 여러 평가라인이 있을 때 모두 리셋할 수 있어야 한다
- 트랜잭션 보장: 중간에 오류 발생 시 전체 롤백
- 목록 제외: 리셋 후 모든 평가라인이 목록에서 제외됨
- 빈 데이터: 평가라인이 없을 때 성공 반환
- 캐스케이드 삭제: 연관된 모든 평가 데이터가 올바른 순서로 삭제됨
- 리셋 후 새로운 평가라인 구성 및 조회가 가능해야 한다`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '모든 평가라인 데이터가 성공적으로 리셋되었습니다.',
        schema: {
            type: 'object',
            properties: {
                deletedCounts: {
                    type: 'object',
                    description: '각 엔티티별 삭제 개수',
                    properties: {
                        peerEvaluationQuestionMappings: { type: 'number' },
                        peerEvaluations: { type: 'number' },
                        downwardEvaluations: { type: 'number' },
                        evaluationLineMappings: { type: 'number' },
                    },
                },
                message: { type: 'string', description: '리셋 결과 메시지' },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ResetAllSelfEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('self-evaluations/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '모든 자기평가 리셋',
        description: `⚠️ **위험**: 모든 자기평가 및 관련 하향평가 데이터를 완전히 리셋합니다. 이 작업은 되돌릴 수 없습니다.

**리셋되는 데이터:**
- 자기평가에 연결된 하향평가
- 자기평가

**동작:**
- 모든 삭제는 하나의 트랜잭션으로 처리되어 원자성 보장
- 소프트 삭제 방식으로 deletedAt 필드 업데이트
- 삭제된 데이터는 목록 조회에서 자동 제외
- 먼저 자기평가에 연결된 하향평가를 삭제한 후 자기평가를 삭제

**사용 사례:**
- 개발/테스트 환경에서 자기평가 데이터 초기화
- 평가 시스템 전체 리셋
- 평가 데이터 재설정

**테스트 케이스:**
- 여러 자기평가가 있을 때 모두 리셋할 수 있어야 한다
- 자기평가에 연결된 하향평가도 함께 삭제되어야 한다
- 트랜잭션 보장: 중간에 오류 발생 시 전체 롤백
- 목록 제외: 리셋 후 모든 자기평가가 목록에서 제외됨
- 빈 데이터: 자기평가가 없을 때 성공 반환
- 캐스케이드 삭제: 연관된 모든 하향평가가 올바른 순서로 삭제됨
- 리셋 후 새로운 자기평가 생성 및 조회가 가능해야 한다`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '모든 자기평가 데이터가 성공적으로 리셋되었습니다.',
        schema: {
            type: 'object',
            properties: {
                deletedCounts: {
                    type: 'object',
                    description: '각 엔티티별 삭제 개수',
                    properties: {
                        downwardEvaluations: { type: 'number' },
                        selfEvaluations: { type: 'number' },
                    },
                },
                message: { type: 'string', description: '리셋 결과 메시지' },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
//# sourceMappingURL=admin-utils-api.decorators.js.map