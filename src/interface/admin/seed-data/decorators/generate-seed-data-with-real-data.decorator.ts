import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SeedDataResultDto } from '../dto/seed-data-result.dto';
import { RealDataSeedConfigDto } from '../dto/real-data-seed-config.dto';

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
          description: '실제 부서/직원만 사용, 최소 프로젝트/WBS',
          value: {
            scenario: 'minimal',
            clearExisting: true,
            dataScale: {
              projectCount: 2,
              wbsPerProject: 5,
            },
          },
        },
        minimalWithProjects: {
          summary: '2. MINIMAL (프로젝트) - 프로젝트 5개 포함',
          description: '실제 조직 + 프로젝트/WBS 생성',
          value: {
            scenario: 'minimal',
            clearExisting: true,
            dataScale: {
              projectCount: 5,
              wbsPerProject: 10,
            },
          },
        },
        withPeriodSingle: {
          summary: '3. WITH_PERIOD - 평가기간 1개',
          description: '실제 조직 + 평가기간 1개',
          value: {
            scenario: 'with_period',
            clearExisting: true,
            dataScale: {
              projectCount: 5,
              wbsPerProject: 10,
            },
            evaluationConfig: {
              periodCount: 1,
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
            dataScale: {
              projectCount: 10,
              wbsPerProject: 15,
            },
            evaluationConfig: {
              periodCount: 3,
            },
          },
        },
        withAssignments: {
          summary: '5. WITH_ASSIGNMENTS - 프로젝트 10개, 할당 포함',
          description: '실제 조직 + 프로젝트/WBS 할당 포함',
          value: {
            scenario: 'with_assignments',
            clearExisting: true,
            dataScale: {
              projectCount: 10,
              wbsPerProject: 15,
            },
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        withSetup: {
          summary: '6. WITH_SETUP - 평가기준 설정 완료 (1단계)',
          description: '평가 라인, WBS 평가기준, 질문 그룹까지 설정 완료',
          value: {
            scenario: 'with_setup',
            clearExisting: true,
            dataScale: {
              projectCount: 10,
              wbsPerProject: 15,
            },
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        fullPrimaryOnly: {
          summary: '7. FULL (1차 완료) - 1차 하향평가까지 완료 ⭐',
          description: '자기평가 + 1차 하향평가 완료, 2차/동료/최종평가 미작성',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              projectCount: 10,
              wbsPerProject: 15,
            },
            evaluationConfig: {
              periodCount: 1,
            },
            stateDistribution: {
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
            },
          },
        },
        fullSecondaryComplete: {
          summary: '8. FULL (2차 완료) - 성과평가 입력 완료 ⭐',
          description: '자기/1차/2차 하향/동료평가 완료, 최종평가 미작성',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              projectCount: 10,
              wbsPerProject: 15,
            },
            evaluationConfig: {
              periodCount: 1,
            },
            stateDistribution: {
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
            },
          },
        },
        fullComplete: {
          summary: '9. FULL (전체 완료) - 최종평가까지 완료 ⭐⭐⭐ (권장)',
          description:
            '실제 조직으로 전체 평가 프로세스 완료 (운영 환경 시뮬레이션)',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              projectCount: 10,
              wbsPerProject: 15,
            },
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        fullMediumProject: {
          summary: '10. FULL (중규모) - 프로젝트 15개',
          description: '실제 조직 + 중규모 프로젝트 환경',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              projectCount: 15,
              wbsPerProject: 20,
            },
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        fullLargeProject: {
          summary: '11. FULL (대규모) - 프로젝트 50개',
          description: '실제 조직 + 대규모 프로젝트 환경',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              projectCount: 50,
              wbsPerProject: 30,
            },
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        fullMultiPeriod: {
          summary: '12. FULL (다중기간) - 평가기간 3개',
          description: '실제 조직 + 연간 3회 평가 시나리오',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              projectCount: 15,
              wbsPerProject: 20,
            },
            evaluationConfig: {
              periodCount: 3,
            },
          },
        },
        demoPresentation: {
          summary: '13. DEMO - 프리젠테이션/시연용 ✨',
          description: '완성도 높은 데모 데이터 (고객 시연, 교육 자료용)',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              projectCount: 12,
              wbsPerProject: 18,
            },
            evaluationConfig: {
              periodCount: 2,
            },
          },
        },
        performanceTest: {
          summary: '14. PERFORMANCE - 프로젝트 100개, 성능 테스트용',
          description: '실제 조직 + 대용량 프로젝트, 시스템 부하 테스트용',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              projectCount: 100,
              wbsPerProject: 50,
            },
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        cleanStart: {
          summary: '15. CLEAN START - 전체 삭제 후 재생성 ⚠️',
          description:
            '모든 기존 데이터 삭제 후 재생성 (⚠️ 실제 부서/직원 데이터도 삭제)',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              projectCount: 10,
              wbsPerProject: 15,
            },
            evaluationConfig: {
              periodCount: 1,
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
