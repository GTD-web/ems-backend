"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiAddNewEmployees = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const seed_data_1 = require("../../dto/seed-data");
const ApiAddNewEmployees = () => (0, common_1.applyDecorators)((0, swagger_1.ApiOperation)({
    summary: '신규 입사자 추가',
    description: `신규 입사자를 직원 목록에 자동 생성하여 추가합니다.

**동작:**
- 지정된 수만큼 더미 직원 데이터를 자동 생성 (Faker 사용)
- 직원 번호, 이름, 이메일, 전화번호 등 모든 정보가 자동 생성됨
- 각 직원은 재직중 상태로 등록됨
- 시스템 접근이 가능한 상태(isAccessible: true)로 생성
- 외부 시스템 ID는 자동 생성
- 타임스탬프 기반 직원 번호로 중복 방지

**테스트 케이스:**
- 기본 입력: 5명의 신규 입사자 자동 생성
- 소규모 추가: 1명의 신규 입사자 추가
- 대규모 추가: 50명의 신규 입사자 한번에 추가
- 최대 제한 초과: 100명 초과 입력 시 400 에러
- 최소 제한 미만: 0명 또는 음수 입력 시 400 에러
- 잘못된 타입: 숫자가 아닌 값 입력 시 400 에러`,
}), (0, swagger_1.ApiBody)({
    type: seed_data_1.AddNewEmployeesDto,
    examples: {
        small: {
            summary: '1. 소규모 추가 (1명)',
            description: '1명의 신규 입사자를 자동 생성하여 추가',
            value: {
                count: 1,
            },
        },
        basic: {
            summary: '2. 기본 추가 (5명)',
            description: '5명의 신규 입사자를 자동 생성하여 추가',
            value: {
                count: 5,
            },
        },
        medium: {
            summary: '3. 중규모 추가 (10명)',
            description: '10명의 신규 입사자를 자동 생성하여 추가',
            value: {
                count: 10,
            },
        },
        large: {
            summary: '4. 대규모 추가 (50명)',
            description: '50명의 신규 입사자를 자동 생성하여 추가',
            value: {
                count: 50,
            },
        },
    },
}), (0, swagger_1.ApiResponse)({
    status: 201,
    description: '신규 입사자가 성공적으로 추가되었습니다.',
    type: seed_data_1.AddNewEmployeesResultDto,
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 요청 (중복된 직원 번호/이메일, 유효성 검증 실패)',
}), (0, swagger_1.ApiResponse)({
    status: 500,
    description: '서버 오류 (직원 추가 중 오류 발생)',
}));
exports.ApiAddNewEmployees = ApiAddNewEmployees;
//# sourceMappingURL=add-new-employees.decorator.js.map