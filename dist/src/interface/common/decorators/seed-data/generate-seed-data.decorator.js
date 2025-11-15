"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiGenerateSeedData = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const seed_data_result_dto_1 = require("../../dto/seed-data/seed-data-result.dto");
const seed_data_config_dto_1 = require("../../dto/seed-data/seed-data-config.dto");
const ApiGenerateSeedData = () => (0, common_1.applyDecorators)((0, swagger_1.ApiOperation)({
    summary: '시드 데이터 생성 (Faker)',
    description: `Faker로 생성된 가짜 데이터를 사용하여 시드 데이터를 생성합니다.
개발 및 디버깅에 최적화되어 있으며, departmentCount/employeeCount로 규모를 조절할 수 있습니다.

**하향평가 옵션:**
- downwardEvaluationProgress: 1차/2차 구분 없이 모두 동일하게 적용
- primaryDownwardEvaluationProgress + secondaryDownwardEvaluationProgress: 1차/2차 별도 지정

실제 조직 구조로 테스트하려면 /generate-with-real-data 엔드포인트를 사용하세요.`,
}), (0, swagger_1.ApiBody)({
    type: seed_data_config_dto_1.SeedDataConfigDto,
    examples: {
        minimalSmall: {
            summary: '1. MINIMAL (소규모) - 직원 5명, 디버깅용',
            description: '초기 개발 및 디버깅용 최소 데이터 (직원 5명)',
            value: {
                scenario: 'minimal',
                clearExisting: true,
                dataScale: {
                    departmentCount: 3,
                    employeeCount: 5,
                    projectCount: 2,
                    wbsPerProject: 3,
                },
            },
        },
        minimalStandard: {
            summary: '2. MINIMAL (표준) - 직원 50명, 기본 테스트용',
            description: '조직 데이터만 생성, 기본 기능 테스트용 (직원 50명)',
            value: {
                scenario: 'minimal',
                clearExisting: true,
                dataScale: {
                    departmentCount: 10,
                    employeeCount: 50,
                    projectCount: 5,
                    wbsPerProject: 10,
                },
            },
        },
        withPeriod: {
            summary: '3. WITH_PERIOD - 평가기간 2개 포함',
            description: '평가기간 기능 테스트용 (직원 50명, 평가기간 2개)',
            value: {
                scenario: 'with_period',
                clearExisting: true,
                dataScale: {
                    departmentCount: 10,
                    employeeCount: 50,
                    projectCount: 10,
                    wbsPerProject: 10,
                },
                evaluationConfig: {
                    periodCount: 2,
                },
                stateDistribution: {
                    evaluationPeriodStatus: {
                        waiting: 0.2,
                        inProgress: 0.8,
                        completed: 0.0,
                    },
                    evaluationPeriodPhase: {
                        evaluationSetup: 0.2,
                        performance: 0.2,
                        selfEvaluation: 0.3,
                        peerEvaluation: 0.2,
                        closure: 0.1,
                    },
                    excludedFromEvaluation: 0.01,
                },
            },
        },
        withAssignments: {
            summary: '4. WITH_ASSIGNMENTS - 프로젝트/WBS 할당 포함',
            description: '프로젝트/WBS 할당 기능 테스트용 (직원 50명)',
            value: {
                scenario: 'with_assignments',
                clearExisting: true,
                dataScale: {
                    departmentCount: 10,
                    employeeCount: 50,
                    projectCount: 10,
                    wbsPerProject: 10,
                },
                evaluationConfig: {
                    periodCount: 1,
                },
                stateDistribution: {
                    evaluationPeriodStatus: {
                        waiting: 0.2,
                        inProgress: 0.8,
                        completed: 0.0,
                    },
                    evaluationPeriodPhase: {
                        evaluationSetup: 0.2,
                        performance: 0.2,
                        selfEvaluation: 0.3,
                        peerEvaluation: 0.2,
                        closure: 0.1,
                    },
                    excludedFromEvaluation: 0.01,
                },
            },
        },
        withSetup: {
            summary: '5. WITH_SETUP - 평가기준 설정 완료 (1단계)',
            description: '평가기준 설정 완료 상태 (직원 30명)',
            value: {
                scenario: 'with_setup',
                clearExisting: true,
                dataScale: {
                    departmentCount: 10,
                    employeeCount: 30,
                    projectCount: 5,
                    wbsPerProject: 10,
                },
                evaluationConfig: {
                    periodCount: 1,
                },
                stateDistribution: {
                    evaluationPeriodStatus: {
                        waiting: 0.1,
                        inProgress: 0.9,
                        completed: 0.0,
                    },
                    evaluationPeriodPhase: {
                        evaluationSetup: 0.0,
                        performance: 0.0,
                        selfEvaluation: 0.4,
                        peerEvaluation: 0.4,
                        closure: 0.2,
                    },
                    excludedFromEvaluation: 0.01,
                },
            },
        },
        withEvaluations: {
            summary: '6. WITH_EVALUATIONS - 성과평가 완료 (2단계)',
            description: '성과평가 완료, 최종평가 미시작 상태 (직원 20명)',
            value: {
                scenario: 'with_evaluations',
                clearExisting: true,
                dataScale: {
                    departmentCount: 5,
                    employeeCount: 20,
                    projectCount: 3,
                    wbsPerProject: 10,
                },
                evaluationConfig: {
                    periodCount: 1,
                },
                stateDistribution: {
                    evaluationPeriodStatus: {
                        waiting: 0.1,
                        inProgress: 0.9,
                        completed: 0.0,
                    },
                    evaluationPeriodPhase: {
                        evaluationSetup: 0.0,
                        performance: 0.0,
                        selfEvaluation: 0.0,
                        peerEvaluation: 0.0,
                        closure: 1.0,
                    },
                    excludedFromEvaluation: 0.01,
                },
            },
        },
        fullPrimaryOnly: {
            summary: '7. FULL (1차 완료) - 1차 하향평가까지 완료 ⭐',
            description: '자기평가 + 1차 하향평가 완료, 2차/동료/최종평가 미작성 (직원 10명)',
            value: {
                scenario: 'full',
                clearExisting: true,
                dataScale: {
                    departmentCount: 2,
                    employeeCount: 10,
                    projectCount: 3,
                    wbsPerProject: 5,
                },
                evaluationConfig: {
                    periodCount: 1,
                },
                stateDistribution: {
                    evaluationPeriodStatus: {
                        waiting: 0.1,
                        inProgress: 0.9,
                        completed: 0.0,
                    },
                    evaluationPeriodPhase: {
                        evaluationSetup: 0.0,
                        performance: 0.0,
                        selfEvaluation: 0.0,
                        peerEvaluation: 0.0,
                        closure: 1.0,
                    },
                    selfEvaluationProgress: {
                        completed: 1.0,
                    },
                    primaryDownwardEvaluationProgress: {
                        completed: 1.0,
                    },
                    secondaryDownwardEvaluationProgress: {
                        notStarted: 1.0,
                    },
                    peerEvaluationProgress: {
                        notStarted: 1.0,
                    },
                    finalEvaluationProgress: {
                        notStarted: 1.0,
                    },
                    excludedFromEvaluation: 0.01,
                },
            },
        },
        fullSecondaryComplete: {
            summary: '8. FULL (2차 완료) - 성과평가 입력 완료 ⭐',
            description: '자기/1차/2차 하향/동료평가 완료, 최종평가 미작성 (직원 10명)',
            value: {
                scenario: 'full',
                clearExisting: true,
                dataScale: {
                    departmentCount: 2,
                    employeeCount: 10,
                    projectCount: 3,
                    wbsPerProject: 5,
                },
                evaluationConfig: {
                    periodCount: 1,
                },
                stateDistribution: {
                    evaluationPeriodStatus: {
                        waiting: 0.1,
                        inProgress: 0.9,
                        completed: 0.0,
                    },
                    evaluationPeriodPhase: {
                        evaluationSetup: 0.0,
                        performance: 0.0,
                        selfEvaluation: 0.0,
                        peerEvaluation: 0.0,
                        closure: 1.0,
                    },
                    selfEvaluationProgress: {
                        completed: 1.0,
                    },
                    downwardEvaluationProgress: {
                        completed: 1.0,
                    },
                    peerEvaluationProgress: {
                        completed: 1.0,
                    },
                    finalEvaluationProgress: {
                        notStarted: 1.0,
                    },
                    excludedFromEvaluation: 0.01,
                },
            },
        },
        fullComplete: {
            summary: '9. FULL (전체 완료) - 최종평가까지 완료',
            description: '최종평가까지 모두 완료, 전체 사이클 완료 (직원 10명)',
            value: {
                scenario: 'full',
                clearExisting: true,
                dataScale: {
                    departmentCount: 2,
                    employeeCount: 10,
                    projectCount: 10,
                    wbsPerProject: 15,
                },
                evaluationConfig: {
                    periodCount: 1,
                },
                stateDistribution: {
                    evaluationPeriodStatus: {
                        waiting: 0.0,
                        inProgress: 0.0,
                        completed: 1.0,
                    },
                    evaluationPeriodPhase: {
                        evaluationSetup: 0.0,
                        performance: 0.0,
                        selfEvaluation: 0.0,
                        peerEvaluation: 0.0,
                        closure: 1.0,
                    },
                    selfEvaluationProgress: {
                        completed: 1.0,
                        notStarted: 0.0,
                        inProgress: 0.0,
                    },
                    primaryDownwardEvaluationProgress: {
                        completed: 1.0,
                        notStarted: 0.0,
                        inProgress: 0.0,
                    },
                    secondaryDownwardEvaluationProgress: {
                        completed: 1.0,
                        notStarted: 0.0,
                        inProgress: 0.0,
                    },
                    peerEvaluationProgress: {
                        completed: 1.0,
                        notStarted: 0.0,
                        inProgress: 0.0,
                    },
                    finalEvaluationProgress: {
                        completed: 1.0,
                        notStarted: 0.0,
                        inProgress: 0.0,
                    },
                    excludedFromEvaluation: 0.01,
                },
            },
        },
        customExclusion: {
            summary: '10. CUSTOM (직원 제외) - 제외 대상자 3%/5% 테스트',
            description: '직원 제외 상태 테스트 (조회 제외 3%, 평가 제외 5%)',
            value: {
                scenario: 'full',
                clearExisting: true,
                dataScale: {
                    departmentCount: 15,
                    employeeCount: 100,
                    projectCount: 10,
                    wbsPerProject: 15,
                },
                evaluationConfig: {
                    periodCount: 1,
                },
                stateDistribution: {
                    excludedFromList: 0.03,
                    excludedFromEvaluation: 0.05,
                },
            },
        },
        customProgress: {
            summary: '11. CUSTOM (진행중) - 평가 진행 상태 5% 테스트',
            description: '평가 진행 중 상태 테스트 (자기평가 5% 완료)',
            value: {
                scenario: 'full',
                clearExisting: true,
                dataScale: {
                    departmentCount: 5,
                    employeeCount: 20,
                    projectCount: 3,
                    wbsPerProject: 10,
                },
                evaluationConfig: {
                    periodCount: 1,
                },
                stateDistribution: {
                    selfEvaluationProgress: {
                        notStarted: 0.7,
                        inProgress: 0.25,
                        completed: 0.05,
                    },
                    downwardEvaluationProgress: {
                        notStarted: 0.9,
                        inProgress: 0.08,
                        completed: 0.02,
                    },
                    peerEvaluationProgress: {
                        notStarted: 0.95,
                        inProgress: 0.05,
                        completed: 0,
                    },
                    finalEvaluationProgress: {
                        notStarted: 1.0,
                        inProgress: 0,
                        completed: 0,
                    },
                },
            },
        },
    },
}), (0, swagger_1.ApiResponse)({
    status: 201,
    description: '시드 데이터 생성 성공',
    type: seed_data_result_dto_1.SeedDataResultDto,
}), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '잘못된 요청 (유효성 검증 실패)',
}), (0, swagger_1.ApiResponse)({
    status: 500,
    description: '서버 오류 (생성 중 오류 발생)',
}));
exports.ApiGenerateSeedData = ApiGenerateSeedData;
//# sourceMappingURL=generate-seed-data.decorator.js.map