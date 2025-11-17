import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDate } from 'class-validator';
import { OptionalDateToUTC } from '@interface/common/decorators';

/**
 * 직원별 최종평가 목록 조회 Query DTO
 */
export class GetEmployeeFinalEvaluationsQueryDto {
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
export class EmployeeBasicInfoDto {
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

  @ApiPropertyOptional({
    description: '직원 상태',
    enum: ['재직중', '휴직중', '퇴사'],
    example: '재직중',
    nullable: true,
  })
  status?: '재직중' | '휴직중' | '퇴사';

  @ApiPropertyOptional({
    description: '입사일',
    type: 'string',
    format: 'date',
    example: '2024-01-01',
    nullable: true,
  })
  hireDate?: Date | null;
}

/**
 * 평가기간 정보 DTO
 */
export class EvaluationPeriodInfoDto {
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
 * 최종평가 항목 DTO
 */
export class FinalEvaluationItemDto {
  @ApiProperty({
    description: '최종평가 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '평가기간 정보',
    type: () => EvaluationPeriodInfoDto,
  })
  period: EvaluationPeriodInfoDto;

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
 * 직원별 최종평가 목록 응답 DTO
 */
export class EmployeeFinalEvaluationListResponseDto {
  @ApiProperty({
    description: '직원 정보',
    type: () => EmployeeBasicInfoDto,
  })
  employee: EmployeeBasicInfoDto;

  @ApiProperty({
    description: '최종평가 목록 (평가기간별)',
    type: [FinalEvaluationItemDto],
  })
  finalEvaluations: FinalEvaluationItemDto[];
}
