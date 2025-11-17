"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedDataConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const types_1 = require("../../../../context/seed-data-context/types");
class DataScaleDto {
    departmentCount;
    employeeCount;
    projectCount;
    wbsPerProject;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성할 부서 수',
        example: 10,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DataScaleDto.prototype, "departmentCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성할 직원 수',
        example: 50,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DataScaleDto.prototype, "employeeCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성할 프로젝트 수',
        example: 5,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DataScaleDto.prototype, "projectCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트당 WBS 개수',
        example: 10,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DataScaleDto.prototype, "wbsPerProject", void 0);
class SeedDataConfigDto {
    scenario;
    clearExisting;
    dataScale;
    evaluationConfig;
    stateDistribution;
    includeCurrentUserAsEvaluator;
    useRealDepartments;
    useRealEmployees;
}
exports.SeedDataConfigDto = SeedDataConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시나리오 타입',
        enum: types_1.SeedScenario,
        example: types_1.SeedScenario.MINIMAL,
    }),
    (0, class_validator_1.IsEnum)(types_1.SeedScenario),
    __metadata("design:type", String)
], SeedDataConfigDto.prototype, "scenario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '기존 데이터 삭제 여부',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SeedDataConfigDto.prototype, "clearExisting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '데이터 규모 설정',
        type: DataScaleDto,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DataScaleDto),
    __metadata("design:type", DataScaleDto)
], SeedDataConfigDto.prototype, "dataScale", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 설정 (선택사항)',
        example: { periodCount: 1 },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SeedDataConfigDto.prototype, "evaluationConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상태 분포 설정 (선택사항, 기본값 사용 가능). ' +
            '부서 계층 구조(departmentHierarchy), 직원 상태(employeeStatus), 직원 조회 제외(excludedFromList), ' +
            '평가 대상 제외(excludedFromEvaluation), 평가 진행 상태 등을 커스터마이징할 수 있습니다. ' +
            '자세한 내용은 API 문서를 참고하세요.',
        example: {
            departmentHierarchy: {
                maxDepth: 3,
                childrenPerParent: { min: 1, max: 4 },
                rootDepartmentRatio: 0.15,
            },
            employeeStatus: { active: 0.85, onLeave: 0.05, resigned: 0.1 },
            excludedFromList: 0.03,
            excludedFromEvaluation: 0.05,
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SeedDataConfigDto.prototype, "stateDistribution", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '현재 사용자를 평가자로 등록할지 여부. ' +
            'true인 경우 현재 로그인한 사용자가 1차/2차 평가자로 등록되어 ' +
            '테스트 시 할당된 피평가자 목록을 조회할 수 있습니다.',
        example: true,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SeedDataConfigDto.prototype, "includeCurrentUserAsEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '실제 부서 데이터 사용 여부. ' +
            'false인 경우 Faker로 생성된 더미 부서를 사용합니다.',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SeedDataConfigDto.prototype, "useRealDepartments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '실제 직원 데이터 사용 여부. ' +
            'false인 경우 Faker로 생성된 더미 직원을 사용합니다.',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SeedDataConfigDto.prototype, "useRealEmployees", void 0);
//# sourceMappingURL=seed-data-config.dto.js.map