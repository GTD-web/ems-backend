"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetStepApprovalEnums = GetStepApprovalEnums;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const step_approval_enums_dto_1 = require("../../dto/step-approval/step-approval-enums.dto");
function GetStepApprovalEnums() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('enums'), (0, swagger_1.ApiOperation)({
        summary: '단계 승인 Enum 조회',
        description: `**공용**: 단계 승인 API에서 사용 가능한 단계와 상태 enum 목록을 조회합니다.

**동작:**
- 가능한 단계 목록을 반환합니다
- 가능한 승인 상태 목록을 반환합니다
- 프론트엔드에서 드롭다운이나 선택 옵션을 동적으로 생성할 때 사용합니다

**반환 데이터:**
- \`steps\`: 가능한 단계 목록 (criteria, self, primary, secondary)
- \`statuses\`: 가능한 승인 상태 목록 (pending, approved, revision_requested, revision_completed)

**사용 시나리오:**
- 프론트엔드에서 단계 선택 드롭다운 생성
- 프론트엔드에서 상태 선택 드롭다운 생성
- API 문서화 및 클라이언트 코드 생성

**테스트 케이스:**
- 정상 조회: 단계와 상태 enum 목록 반환
- 응답 구조 검증: steps와 statuses 배열 포함 확인`,
    }), (0, swagger_1.ApiOkResponse)({
        description: '단계 승인 Enum 목록 조회 성공',
        type: step_approval_enums_dto_1.StepApprovalEnumsResponseDto,
    }));
}
//# sourceMappingURL=step-approval-enums-api.decorators.js.map