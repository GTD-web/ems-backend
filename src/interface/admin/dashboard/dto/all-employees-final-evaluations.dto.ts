import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDate } from 'class-validator';
import { OptionalDateToUTC } from '@interface/decorators';

/**
 * 전체 직원별 최종평가 목록 조회 Query DTO
 */
export class GetAllEmployeesFinalEvaluationsQueryDto {
  @ApiPropertyOptional({
    description: '조회 시작일 (평가기간 시작일 기준)',
    type: 'string',
    format: 'date',
    example: '2024-01-01',
  })
  @IsOptional()
  @OptionalDateToUTC()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: '조회 종료일 (평가기간 시작일 기준)',
    type: 'string',
    format: 'date',
    example: '2024-12-31',
  })
  @IsOptional()
  @OptionalDateToUTC()
  @IsDate()
  endDate?: Date;
}

/**
 * 직원 기본 정보 DTO
 */
export class EmployeeBasicDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: '직원명',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '직원 사번',
    example: 'EMP001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: '부서명',
    example: '개발팀',
    nullable: true,
  })
  departmentName: string | null;

  @ApiPropertyOptional({
    description: '직책명',
    example: '대리',
    nullable: true,
  })
  rankName: string | null;
}

/**
 * 평가기간 정보 DTO
 */
export class PeriodBasicDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  id: string;

  @ApiProperty({
    description: '평가기간명',
    example: '2024년 상반기',
  })
  name: string;

  @ApiProperty({
    description: '평가기간 시작일',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

}

/**
 * 최종평가 정보 DTO
 */
export class FinalEvaluationBasicDto {
  @ApiProperty({
    description: '최종평가 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '평가등급 (S, A, B, C, D 등)',
    example: 'A',
  })
  evaluationGrade: string;

  @ApiProperty({
    description: '직무등급 (T1, T2, T3)',
    enum: ['T1', 'T2', 'T3'],
    example: 'T2',
  })
  jobGrade: string;

  @ApiProperty({
    description: '직무 상세등급 (u: 낮음, n: 중간, a: 높음)',
    enum: ['u', 'n', 'a'],
    example: 'n',
  })
  jobDetailedGrade: string;

  @ApiPropertyOptional({
    description: '최종 평가 의견',
    example: '전반적으로 우수한 성과를 보였습니다.',
    nullable: true,
  })
  finalComments: string | null;

  @ApiProperty({
    description: '확정 여부',
    example: true,
  })
  isConfirmed: boolean;

  @ApiPropertyOptional({
    description: '확정일시',
    type: 'string',
    format: 'date-time',
    example: '2024-06-30T15:00:00.000Z',
    nullable: true,
  })
  confirmedAt: Date | null;

  @ApiPropertyOptional({
    description: '확정자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  confirmedBy: string | null;

  @ApiProperty({
    description: '생성일시',
    type: 'string',
    format: 'date-time',
    example: '2024-06-01T09:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    type: 'string',
    format: 'date-time',
    example: '2024-06-30T15:00:00.000Z',
  })
  updatedAt: Date;
}

/**
 * 직원별 최종평가 목록 DTO
 * (평가기간 배열 순서에 맞게 최종평가가 배열로 제공됨)
 */
export class EmployeeWithFinalEvaluationsDto {
  @ApiProperty({
    description: '직원 정보',
    type: () => EmployeeBasicDto,
  })
  employee: EmployeeBasicDto;

  @ApiProperty({
    description:
      '최종평가 목록 (평가기간 배열 순서와 매칭됨, 해당 평가기간에 평가가 없으면 해당 인덱스는 null)',
    type: [FinalEvaluationBasicDto],
    isArray: true,
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
        finalComments: '우수한 성과를 보였습니다.',
        isConfirmed: true,
        confirmedAt: '2024-07-15T10:30:00.000Z',
        confirmedBy: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: '2024-07-10T14:20:00.000Z',
        updatedAt: '2024-07-15T10:30:00.000Z',
      },
      null,
    ],
  })
  finalEvaluations: (FinalEvaluationBasicDto | null)[];
}

/**
 * 전체 직원별 최종평가 목록 응답 DTO
 */
export class AllEmployeesFinalEvaluationsResponseDto {
  @ApiProperty({
    description: '평가기간 목록 (시작일 내림차순 정렬)',
    type: [PeriodBasicDto],
  })
  evaluationPeriods: PeriodBasicDto[];

  @ApiProperty({
    description: '직원별 최종평가 목록 (사번 오름차순 정렬)',
    type: [EmployeeWithFinalEvaluationsDto],
  })
  employees: EmployeeWithFinalEvaluationsDto[];
}
