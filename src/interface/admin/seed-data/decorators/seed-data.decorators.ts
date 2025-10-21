import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SeedDataResultDto } from '../dto/seed-data-result.dto';
import { GetSeedDataStatusDto } from '../dto/get-seed-data-status.dto';
import { SeedDataConfigDto } from '../dto/seed-data-config.dto';
import { RealDataSeedConfigDto } from '../dto/real-data-seed-config.dto';

export const ApiGenerateSeedData = () =>
  applyDecorators(
    ApiOperation({
      summary: '시드 데이터 생성 (Faker)',
      description: `**Faker로 생성된 가짜 데이터**를 사용하여 시드 데이터를 생성합니다.

**주요 기능:**
- ✅ **빠른 테스트**: 개발 및 디버깅에 최적화
- ✅ **개수 조절**: departmentCount, employeeCount로 규모 조정
- ✅ **일관된 데이터**: faker로 생성되어 예측 가능

**vs. 실제 데이터 생성 (/generate-with-real-data):**
실제 조직 구조로 테스트하려면 \`/generate-with-real-data\` 엔드포인트를 사용하세요.

**부서 계층 생성 규칙 (고정):**
- 회사: 1개 (고정)
- 본부: 나머지의 30%
- 파트: 나머지의 70%
- 예: departmentCount=20 → 회사 1개, 본부 6개, 파트 13개`,
    }),
    ApiBody({
      type: SeedDataConfigDto,
      examples: {
        minimalSmall: {
          summary: '1. MINIMAL - 소규모 (디버깅용)',
          description:
            '최소 데이터로 빠른 확인 - 초기 개발 및 디버깅에 적합 (직원 5명)',
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
          summary: '2. MINIMAL - 표준 (기본 테스트)',
          description:
            '조직 데이터만 생성 - 기본 기능 테스트에 적합 (직원 50명)',
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
          summary: '3. WITH_PERIOD - 평가기간 포함',
          description:
            '조직 데이터 + 평가기간 생성 - 평가기간 기능 테스트 (직원 50명, 평가기간 2개)',
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
          },
        },
        withAssignments: {
          summary: '4. WITH_ASSIGNMENTS - 할당 포함',
          description:
            '조직 + 평가기간 + 프로젝트/WBS 할당 - 할당 기능 테스트 (직원 50명)',
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
          },
        },
        withSetup: {
          summary: '5. WITH_SETUP - 평가기준설정 완료 (1단계)',
          description:
            '평가 라인, WBS 평가기준, 질문 그룹까지 설정 완료 - 평가 설정 기능 테스트 (직원 30명)',
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
          },
        },
        withEvaluations: {
          summary: '6. WITH_EVALUATIONS - 성과평가입력 완료 (2단계)',
          description:
            '자기평가/하향평가/동료평가 완료, 최종평가 미시작 - 최종평가 기능 테스트 (직원 20명)',
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
          },
        },
        full: {
          summary: '7. FULL - 전체 평가 사이클 완료 (3단계)',
          description:
            '최종평가까지 모두 완료 - 전체 프로세스 검증, 통계/리포트 테스트 (직원 20명)',
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
          },
        },
        customExclusion: {
          summary: '8. 커스텀 - 직원 제외 비율 조정',
          description:
            '조회 제외 10%, 평가 제외 15% - 조직 개편이나 구조조정 시기 테스트 (직원 100명)',
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
              excludedFromList: 0.1,
              excludedFromEvaluation: 0.15,
            },
          },
        },
        customProgress: {
          summary: '9. 커스텀 - 평가 진행 상태 조정',
          description:
            '2단계 막 시작 (자기평가 5% 완료) - 평가 진행 중 상태 테스트 (직원 20명)',
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
        largeScale: {
          summary: '10. 대규모 - 성능 테스트용',
          description:
            '대규모 조직 데이터 생성 - 성능 및 대용량 데이터 테스트 (직원 500명)',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              departmentCount: 50,
              employeeCount: 500,
              projectCount: 100,
              wbsPerProject: 20,
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
      description: '시드 데이터 생성 성공',
      type: SeedDataResultDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (유효성 검증 실패)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 오류 (생성 중 오류 발생)',
    }),
  );

export const ApiClearSeedData = () =>
  applyDecorators(
    ApiOperation({
      summary: '시드 데이터 삭제',
      description: '생성된 시드 데이터를 삭제합니다.',
    }),
    ApiResponse({
      status: 200,
      description: '시드 데이터 삭제 성공',
    }),
    ApiResponse({
      status: 500,
      description: '서버 오류 (삭제 중 오류 발생)',
    }),
  );

export const ApiGetSeedDataStatus = () =>
  applyDecorators(
    ApiOperation({
      summary: '시드 데이터 상태 조회',
      description: '현재 시스템에 존재하는 시드 데이터의 상태를 조회합니다.',
    }),
    ApiResponse({
      status: 200,
      description: '상태 조회 성공',
      type: GetSeedDataStatusDto,
    }),
  );

export const ApiGenerateSeedDataWithRealData = () =>
  applyDecorators(
    ApiOperation({
      summary: '실제 데이터 기반 시드 데이터 생성 ✨ (외부 서버 동기화)',
      description: `**외부 서버 (HR 시스템)에서 실제 부서와 직원 데이터를 동기화**한 후 시드 데이터를 생성합니다.

**동작 흐름:**
1. 🔄 **외부 서버에서 실제 부서 데이터 동기화** (EXTERNAL_METADATA_API_URL)
2. 🔄 **외부 서버에서 실제 직원 데이터 동기화**
3. 📊 **동기화된 실제 데이터 기반으로 평가 시스템 데이터 생성** (프로젝트, WBS, 평가 등)

**주요 특징:**
- ✅ **외부 시스템 연동**: 실제 HR 시스템의 최신 조직도 자동 동기화
- ✅ **실제 데이터만 사용**: 동기화된 모든 부서와 직원을 자동으로 사용
- ✅ **개수 옵션 불필요**: departmentCount, employeeCount 설정 없음 (외부에서 가져옴)
- ✅ **실제 환경 시뮬레이션**: 운영 데이터와 동일한 구조로 테스트 가능
- ⚠️ **외부 API 의존성**: 외부 서버 접근 불가 시 Faker 데이터로 fallback

**vs. 일반 시드 데이터 생성 (/generate):**
| 구분 | 일반 생성 | 실제 데이터 생성 |
|------|----------|-----------------|
| 부서/직원 | faker 생성 | 외부 서버에서 동기화 |
| 개수 지정 | departmentCount, employeeCount | 자동 (외부에서 가져옴) |
| 사용 목적 | 빠른 테스트, 개발 | 운영 시뮬레이션, 실제 조직 테스트 |
| clearExisting | true 권장 | false 권장 |
| 외부 API | 불필요 | 필요 (HR 시스템 연동) |

**시나리오별 생성 범위:**
- \`minimal\`: 부서와 직원만 사용 (Phase 1)
- \`with_period\`: 평가기간 추가 (Phase 1-2)
- \`with_assignments\`: 프로젝트/WBS 할당 추가 (Phase 1-3)
- \`with_setup\`: 평가기준/질문 설정 추가 (Phase 1-6)
- \`full\`: 전체 평가 사이클 (Phase 1-8, 권장)

**권장 사용 시나리오:**
1. 실제 조직 구조로 평가 시스템 테스트
2. 실제 인원으로 성능 테스트
3. 데모/프리젠테이션 준비
4. 운영 환경과 동일한 데이터 구조 검증
5. 외부 HR 시스템과의 연동 테스트

**환경 변수:**
- \`EXTERNAL_METADATA_API_URL\`: 외부 메타데이터 API URL (기본값: https://lumir-metadata-manager.vercel.app)
- \`DEPARTMENT_SYNC_ENABLED\`: 부서 동기화 활성화 여부 (기본값: true)
- \`EMPLOYEE_SYNC_ENABLED\`: 직원 동기화 활성화 여부 (기본값: true)`,
    }),
    ApiBody({
      type: RealDataSeedConfigDto,
      examples: {
        minimalQuick: {
          summary: '1. MINIMAL - 빠른 확인 (디버깅용)',
          description:
            '실제 부서/직원만 사용, 추가 데이터 없음 - 초기 개발 및 디버깅에 적합',
          value: {
            scenario: 'minimal',
            clearExisting: true,
          },
        },
        minimalWithProjects: {
          summary: '2. MINIMAL - 프로젝트 포함',
          description: '실제 조직 + 프로젝트/WBS 생성 - 조직 구조 확인에 적합',
          value: {
            scenario: 'minimal',
            clearExisting: true,
            projectCount: 5,
            wbsPerProject: 10,
          },
        },
        withPeriodSingle: {
          summary: '3. WITH_PERIOD - 단일 평가기간',
          description: '실제 조직 + 평가기간 1개 생성 - 평가기간 기능 테스트',
          value: {
            scenario: 'with_period',
            clearExisting: true,
            projectCount: 5,
            wbsPerProject: 10,
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        withPeriodMulti: {
          summary: '4. WITH_PERIOD - 다중 평가기간',
          description:
            '실제 조직 + 평가기간 3개 생성 - 분기별/반기별 평가 시뮬레이션',
          value: {
            scenario: 'with_period',
            clearExisting: true,
            projectCount: 10,
            wbsPerProject: 15,
            evaluationConfig: {
              periodCount: 3,
            },
          },
        },
        withAssignments: {
          summary: '5. WITH_ASSIGNMENTS - 프로젝트/WBS 할당 포함',
          description:
            '실제 조직 + 평가기간 + 프로젝트/WBS 할당 - 할당 기능 테스트',
          value: {
            scenario: 'with_assignments',
            clearExisting: true,
            projectCount: 10,
            wbsPerProject: 15,
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        withSetup: {
          summary: '6. WITH_SETUP - 평가 설정 완료 (1단계)',
          description:
            '평가 라인, WBS 평가기준, 질문 그룹까지 설정 완료 - 평가 설정 기능 테스트',
          value: {
            scenario: 'with_setup',
            clearExisting: true,
            projectCount: 10,
            wbsPerProject: 15,
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        fullRecommended: {
          summary: '7. FULL - 전체 평가 사이클 ⭐⭐⭐ (권장)',
          description:
            '실제 조직으로 전체 평가 프로세스 생성 (자기/하향/동료/최종평가 완료) - 운영 환경 시뮬레이션',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 10,
            wbsPerProject: 15,
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        fullMediumProject: {
          summary: '8. FULL - 중규모 프로젝트 (15개)',
          description:
            '실제 조직 + 중규모 프로젝트 환경 - 일반적인 조직 규모 시뮬레이션',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 15,
            wbsPerProject: 20,
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        fullLargeProject: {
          summary: '9. FULL - 대규모 프로젝트 (50개)',
          description:
            '실제 조직 + 대규모 프로젝트 환경 - 대기업 규모 시뮬레이션',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 50,
            wbsPerProject: 30,
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        fullMultiPeriod: {
          summary: '10. FULL - 다중 평가기간 (3개)',
          description:
            '실제 조직 + 연간 3회 평가 시나리오 - 분기별 평가 운영 시뮬레이션',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 15,
            wbsPerProject: 20,
            evaluationConfig: {
              periodCount: 3,
            },
          },
        },
        demoPresentation: {
          summary: '11. 데모/프리젠테이션용 ✨',
          description:
            '실제 조직 구조로 완성도 높은 데모 데이터 생성 - 고객 시연, 교육 자료용',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 12,
            wbsPerProject: 18,
            evaluationConfig: {
              periodCount: 2,
            },
          },
        },
        performanceTest: {
          summary: '12. 성능 테스트용 (대용량)',
          description:
            '실제 조직 + 대용량 프로젝트로 성능 테스트 - 시스템 부하 테스트용',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 100,
            wbsPerProject: 50,
            evaluationConfig: {
              periodCount: 1,
            },
          },
        },
        cleanStart: {
          summary: '13. 클린 스타트 (기존 데이터 삭제) ⚠️',
          description:
            '모든 기존 데이터 삭제 후 전체 사이클 생성 - 주의: 실제 부서/직원 데이터도 삭제됨',
          value: {
            scenario: 'full',
            clearExisting: true,
            projectCount: 10,
            wbsPerProject: 15,
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
