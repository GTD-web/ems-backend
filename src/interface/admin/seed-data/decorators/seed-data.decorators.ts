import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SeedDataResultDto } from '../dto/seed-data-result.dto';
import { GetSeedDataStatusDto } from '../dto/get-seed-data-status.dto';
import { SeedDataConfigDto } from '../dto/seed-data-config.dto';

export const ApiGenerateSeedData = () =>
  applyDecorators(
    ApiOperation({
      summary: '시드 데이터 생성',
      description: `시나리오에 따라 시드 데이터를 생성합니다.

**주요 기능:**
- clearExisting이 true인 경우 기존 데이터를 삭제한 후 생성합니다.
- 부서는 자동으로 **회사 → 본부 → 파트** 3단계 고정 구조로 생성됩니다.

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
