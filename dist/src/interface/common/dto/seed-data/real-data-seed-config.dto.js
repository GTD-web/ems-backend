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
exports.RealDataSeedConfigDto = exports.EvaluationConfig = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class EvaluationConfig {
    periodCount;
}
exports.EvaluationConfig = EvaluationConfig;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성할 평가기간 수',
        example: 1,
        default: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], EvaluationConfig.prototype, "periodCount", void 0);
class RealDataSeedConfigDto {
    scenario;
    clearExisting;
    projectCount;
    wbsPerProject;
    evaluationConfig;
    stateDistribution;
    includeCurrentUserAsEvaluator;
}
exports.RealDataSeedConfigDto = RealDataSeedConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: `시나리오 타입:
- minimal: 부서와 직원만 (Phase 1)
- with_period: 평가기간 추가 (Phase 1-2)
- with_assignments: 프로젝트/WBS 배정 추가 (Phase 1-3)
- with_setup: 평가기준/질문 설정 추가 (Phase 1-6)
- full: 전체 평가 사이클 (Phase 1-8)`,
        enum: ['minimal', 'with_period', 'with_assignments', 'with_setup', 'full'],
        example: 'full',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['minimal', 'with_period', 'with_assignments', 'with_setup', 'full']),
    __metadata("design:type", String)
], RealDataSeedConfigDto.prototype, "scenario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '기존 데이터 삭제 여부. true인 경우 시드 데이터 생성 전 모든 데이터를 삭제합니다. ' +
            '**실제 데이터 사용 시 false 권장** (실제 부서/직원 데이터 보존)',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RealDataSeedConfigDto.prototype, "clearExisting", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성할 프로젝트 수 (with_assignments, with_setup, full 시나리오에서 사용)',
        example: 10,
        default: 5,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RealDataSeedConfigDto.prototype, "projectCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트당 WBS 개수 (with_assignments, with_setup, full 시나리오에서 사용)',
        example: 15,
        default: 10,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RealDataSeedConfigDto.prototype, "wbsPerProject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 관련 설정 (with_period 이상 시나리오에서 사용)',
        type: EvaluationConfig,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EvaluationConfig),
    __metadata("design:type", EvaluationConfig)
], RealDataSeedConfigDto.prototype, "evaluationConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상태 분포 설정 (선택사항, 기본값 사용 가능). ' +
            '부서 계층 구조(departmentHierarchy), 직원 상태(employeeStatus), 직원 조회 제외(excludedFromList), ' +
            '평가 대상 제외(excludedFromEvaluation), 평가 진행 상태 등을 커스터마이징할 수 있습니다.',
        example: {
            selfEvaluationProgress: {
                completed: 1.0,
                notStarted: 0.0,
                inProgress: 0.0,
            },
            primaryDownwardEvaluationProgress: {
                completed: 0.0,
                notStarted: 1.0,
                inProgress: 0.0,
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RealDataSeedConfigDto.prototype, "stateDistribution", void 0);
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
], RealDataSeedConfigDto.prototype, "includeCurrentUserAsEvaluator", void 0);
//# sourceMappingURL=real-data-seed-config.dto.js.map