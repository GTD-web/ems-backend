import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SeedDataResultDto } from '../../dto/seed-data/seed-data-result.dto';
import { RealDataSeedConfigDto } from '../../dto/seed-data/real-data-seed-config.dto';

export const ApiGenerateSeedDataWithRealData = () =>
  applyDecorators(
    ApiOperation({
      summary: '실제 데이터 기반 시드 데이터 생성 ✨',
      description: `외부 HR 시스템에서 실제 부서와 직원 데이터를 동기화한 후 시드 데이터를 생성합니다.
운영 환경과 동일한 구조로 테스트할 수 있으며, 데모/프리젠테이션 준비에 적합합니다.

**하향평가 옵션:**
- downwardEvaluationProgress: 1차/2차 구분 없이 모두 동일하게 적용
- primaryDownwardEvaluationProgress + secondaryDownwardEvaluationProgress: 1차/2차 별도 지정

환경변수 EXTERNAL_METADATA_API_URL로 외부 서버를 지정할 수 있습니다.`,
    }),
    ApiBody({
      type: RealDataSeedConfigDto,
      examples: {
        minimalQuick: {
          summary: '1. MINIMAL (빠른확인) - 부서/직원만, 디버깅용',
          description: '실제 부서/직원만 사용, 추가 데이터 없음',
          value: {
            scenario: 'minimal',
            clearExisting: true,
          },
        },
        minimalWithProjects: {
          summary: '2. MINIMAL (프로젝트) - 프로젝트 5개 포함',
          description: '실제 조직 + 프로젝트/WBS 생성',
          value: {
            scenario: 'minimal',
            clearExisting: true,
            projectCount: 5,
            wbsPerProject: 10,
          },
        },
        withPeriodSingle: {
          summary: '3. WITH_PERIOD - 평가기간 1개',
          description: '실제 조직 + 평가기간 1개',
          value: {
            scenario: 'with_period',
            clearExisting: true,
            projectCount: 5,
            wbsPerProject: 10,
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
              excludedFromEvaluation: 0.01, // 1%로 제한
            },
          },
        },
        withPeriodMulti: {
          summary: '4. WITH_PERIOD - 평가기간 3개',
          description:
            '실제 조직 + 평가기간 3개, 분기별/반기별 평가 시뮬레이션',
          value: {
            scenario: 'with_period',
            clearExisting: true,
            projectCount: 10,
            wbsPerProject: 15,
            evaluationConfig: {
              periodCount: 3,
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
              excludedFromEvaluation: 0.01, // 1%로 제한
            },
          },
        },
        withAssignments: {
          summary: '5. WITH_ASSIGNMENTS - 프로젝트 10개, 할당 포함',
          description: '실제 조직 + 프로젝트/WBS 할당 포함',
          value: {
            scenario: 'with_assignments',
            clearExisting: true,
            projectCount: 10,
            wbsPerProject: 15,
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
              excludedFromEvaluation: 0.01, // 1%로 제한
            },
          },
        },
        withSetup: {
          summary: '6. WITH_SETUP - 평가기준 설정 완료 (1단계)',
          description: '평가 라인, WBS 평가기준, 질문 그룹까지 설정 완료',
          value: {
            scenario: 'with_setup',
            clearExisting: true,
            projectCount: 10,
            wbsPerProject: 15,
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
              excludedFromEvaluation: 0.01, // 1%로 제한
            },
          },
        },
        fullSelfOnly: {
          summary: '7. FULL (자기평가만) - 자기평가만 완료 ⭐',
          description:
            '자기평가만 완료, 1차/2차 하향평가 미작성 (점수계산 검증용)',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 2,
            wbsPerProject: 3,
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
                selfEvaluation: 1.0, // 자기평가 단계
                peerEvaluation: 0.0,
                closure: 0.0,
              },
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
              secondaryDownwardEvaluationProgress: {
                completed: 0.0,
                notStarted: 1.0,
                inProgress: 0.0,
              },
              peerEvaluationProgress: {
                completed: 0.0,
                notStarted: 1.0,
              },
              finalEvaluationProgress: {
                completed: 0.0,
                notStarted: 1.0,
              },
              excludedFromEvaluation: 0.01, // 1%로 제한
            },
          },
        },
        fullPrimaryOnly: {
          summary: '8. FULL (1차 완료) - 1차 하향평가까지 완료 ⭐',
          description: '자기평가 + 1차 하향평가 완료, 2차/동료/최종평가 미작성',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 2,
            wbsPerProject: 3,
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
                closure: 1.0, // 마감 단계
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
                completed: 0.0,
                notStarted: 1.0,
                inProgress: 0.0,
              },
              peerEvaluationProgress: {
                completed: 0.0,
                notStarted: 1.0,
              },
              finalEvaluationProgress: {
                completed: 0.0,
                notStarted: 1.0,
              },
              excludedFromEvaluation: 0.01, // 1%로 제한
            },
          },
        },
        fullSecondaryComplete: {
          summary: '9. FULL (2차 완료) - 성과평가 입력 완료 ⭐',
          description: '자기/1차/2차 하향/동료평가 완료, 최종평가 미작성',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 2,
            wbsPerProject: 3,
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
                closure: 1.0, // 마감 단계
              },
              evaluationLineMappingTypes: {
                primaryOnly: 0.0,
                primaryAndSecondary: 1.0,
                withAdditional: 0.0,
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
                completed: 0.0,
                notStarted: 1.0,
              },
              finalEvaluationProgress: {
                completed: 0.0,
                notStarted: 1.0,
              },
              excludedFromEvaluation: 0.01, // 1%로 제한
            },
          },
        },
        fullComplete: {
          summary: '10. FULL (전체 완료) - 최종평가까지 완료 ⭐⭐⭐ (권장)',
          description:
            '실제 조직으로 전체 평가 프로세스 완료 (운영 환경 시뮬레이션)',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 10,
            wbsPerProject: 15,
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
                closure: 1.0, // 완료된 마감 단계
              },
              excludedFromEvaluation: 0.01, // 1%로 제한
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: '실제 데이터 기반 시드 데이터 생성 성공',
      type: SeedDataResultDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (유효성 검증 실패)',
    }),
    ApiResponse({
      status: 404,
      description: '실제 데이터가 없습니다 (부서 또는 직원이 DB에 없음)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 오류 (생성 중 오류 발생)',
    }),
  );
