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
        minimal: {
          summary: 'MINIMAL 시나리오',
          description:
            '기본 조직 데이터만 생성 (부서는 회사→본부→파트 3단계 고정 구조로 생성)',
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
          summary: 'WITH_PERIOD 시나리오',
          description:
            '조직 데이터 + 평가기간 (부서는 회사→본부→파트 3단계 고정 구조로 생성)',
          value: {
            scenario: 'with_period',
            clearExisting: true,
            dataScale: {
              departmentCount: 10,
              employeeCount: 50,
              projectCount: 5,
              wbsPerProject: 10,
            },
          },
        },
        full: {
          summary: 'FULL 시나리오',
          description:
            '전체 평가 사이클 데이터 생성 (부서는 회사→본부→파트 3단계 고정 구조로 생성)',
          value: {
            scenario: 'full',
            clearExisting: true,
            dataScale: {
              departmentCount: 15,
              employeeCount: 100,
              projectCount: 10,
              wbsPerProject: 15,
            },
            stateDistribution: {
              employeeStatus: {
                active: 0.85,
                onLeave: 0.05,
                resigned: 0.1,
              },
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
