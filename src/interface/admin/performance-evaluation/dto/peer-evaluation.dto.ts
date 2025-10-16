import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from '@interface/decorators';

/**
 * 동료평가 요청(할당) DTO
 */
export class RequestPeerEvaluationDto {
  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  evaluatorId: string;

  @ApiProperty({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  evaluateeId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  periodId: string;

  @ApiPropertyOptional({
    description: '평가 질문 ID 목록 (해당 질문들에 대해 작성 요청)',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
    ],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  questionIds?: string[];

  @ApiPropertyOptional({
    description: '요청자 ID (관리자)',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  requestedBy?: string;
}

/**
 * 한 명의 피평가자를 여러 평가자에게 요청 DTO
 */
export class RequestPeerEvaluationToMultipleEvaluatorsDto {
  @ApiProperty({
    description: '평가자 ID 목록',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
  })
  @IsUUID('4', { each: true })
  evaluatorIds: string[];

  @ApiProperty({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  evaluateeId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID()
  periodId: string;

  @ApiPropertyOptional({
    description: '평가 질문 ID 목록 (해당 질문들에 대해 작성 요청)',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
    ],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  questionIds?: string[];

  @ApiPropertyOptional({
    description: '요청자 ID (관리자)',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  @IsOptional()
  @IsUUID()
  requestedBy?: string;
}

/**
 * 한 명의 평가자가 여러 피평가자를 평가하도록 요청 DTO
 */
export class RequestMultiplePeerEvaluationsDto {
  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  evaluatorId: string;

  @ApiProperty({
    description: '피평가자 ID 목록',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
  })
  @IsUUID('4', { each: true })
  evaluateeIds: string[];

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID()
  periodId: string;

  @ApiPropertyOptional({
    description: '평가 질문 ID 목록 (해당 질문들에 대해 작성 요청)',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
    ],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  questionIds?: string[];

  @ApiPropertyOptional({
    description: '요청자 ID (관리자)',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  @IsOptional()
  @IsUUID()
  requestedBy?: string;
}

/**
 * 동료평가 생성 Body DTO
 */
export class CreatePeerEvaluationBodyDto {
  @ApiPropertyOptional({
    description: '평가자 ID (추후 요청자 ID로 자동 입력)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  evaluatorId?: string;

  @ApiPropertyOptional({
    description: '동료평가 내용',
    example: '동료로서 협업 능력이 우수합니다.',
  })
  @IsOptional()
  @IsString()
  peerEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '동료평가 점수 (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  peerEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * 동료평가 수정 DTO
 */
export class UpdatePeerEvaluationDto {
  @ApiPropertyOptional({
    description: '동료평가 내용',
    example: '수정된 동료평가 내용입니다.',
  })
  @IsOptional()
  @IsString()
  peerEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '동료평가 점수 (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  peerEvaluationScore?: number;
}

/**
 * 동료평가 제출 DTO
 */
export class SubmitPeerEvaluationDto {
  @ApiPropertyOptional({
    description: '제출자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  submittedBy?: string;
}

/**
 * 동료평가 필터 DTO
 */
export class PeerEvaluationFilterDto {
  @ApiPropertyOptional({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  evaluatorId?: string;

  @ApiPropertyOptional({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  evaluateeId?: string;

  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: '평가 상태',
    example: 'DRAFT',
    enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED', 'COMPLETED'])
  status?: string;

  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * 동료평가 응답 DTO
 */
export class PeerEvaluationResponseDto {
  @ApiProperty({
    description: '동료평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '결과 메시지',
    example: '동료평가가 성공적으로 생성되었습니다.',
  })
  message: string;
}

/**
 * 일괄 동료평가 요청 응답 DTO
 */
export class BulkPeerEvaluationRequestResponseDto {
  @ApiProperty({
    description: '생성된 동료평가 요청 ID 목록',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
  })
  ids: string[];

  @ApiProperty({
    description: '생성된 요청 개수',
    example: 2,
  })
  count: number;

  @ApiProperty({
    description: '결과 메시지',
    example: '2건의 동료평가 요청이 성공적으로 생성되었습니다.',
  })
  message: string;
}

/**
 * 동료평가 기본 정보 DTO
 */
export class PeerEvaluationBasicDto {
  @ApiProperty({
    description: '동료평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluatorId: string;

  @ApiProperty({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  evaluateeId: string;

  @ApiPropertyOptional({
    description: '동료평가 내용',
    example: '동료로서 협업 능력이 우수합니다.',
  })
  peerEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '동료평가 점수 (1-5)',
    example: 4,
  })
  peerEvaluationScore?: number;

  @ApiProperty({
    description: '평가 상태',
    example: 'DRAFT',
    enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
  })
  status: string;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;
}

/**
 * 동료평가 목록 응답 DTO
 */
export class PeerEvaluationListResponseDto {
  @ApiProperty({
    description: '동료평가 목록',
    type: [PeerEvaluationBasicDto],
  })
  evaluations: PeerEvaluationBasicDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 10,
  })
  limit: number;
}

/**
 * 직원 정보 DTO
 */
export class EmployeeInfoDto {
  @ApiProperty({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '직원 이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '사번',
    example: 'EMP001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
  })
  email: string;

  @ApiProperty({
    description: '부서 ID',
    example: 'DEPT001',
  })
  departmentId: string;

  @ApiProperty({
    description: '직원 상태',
    example: 'ACTIVE',
  })
  status: string;
}

/**
 * 부서 정보 DTO
 */
export class DepartmentInfoDto {
  @ApiProperty({
    description: '부서 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '부서명',
    example: '개발팀',
  })
  name: string;

  @ApiProperty({
    description: '부서 코드',
    example: 'DEPT001',
  })
  code: string;
}

/**
 * 평가자에게 할당된 피평가자 Query DTO
 */
export class GetEvaluatorAssignedEvaluateesQueryDto {
  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({
    description: '완료된 평가 포함 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @ToBoolean(false)
  @IsBoolean()
  includeCompleted?: boolean;
}

/**
 * 할당된 피평가자 상세 DTO
 */
export class AssignedEvaluateeDto {
  @ApiProperty({
    description: '평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  evaluationId: string;

  @ApiProperty({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  periodId: string;

  @ApiProperty({
    description: '평가 상태',
    example: 'pending',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
  })
  status: string;

  @ApiProperty({
    description: '평가 완료 여부',
    example: false,
  })
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: '완료 일시',
    example: '2024-01-15T10:00:00Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: '평가 점수',
    example: 4,
  })
  score?: number;

  @ApiPropertyOptional({
    description: '평가 내용',
    example: '동료로서 협업 능력이 우수합니다.',
  })
  evaluationContent?: string;

  @ApiProperty({
    description: '매핑 일시',
    example: '2024-01-15T09:00:00Z',
  })
  mappedDate: Date;

  @ApiProperty({
    description: '활성 상태',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '피평가자 정보',
    type: EmployeeInfoDto,
  })
  evaluatee: EmployeeInfoDto | null;

  @ApiProperty({
    description: '피평가자 부서 정보',
    type: DepartmentInfoDto,
  })
  evaluateeDepartment: DepartmentInfoDto | null;
}

/**
 * 동료평가 상세 응답 DTO
 */
export class PeerEvaluationDetailResponseDto extends PeerEvaluationBasicDto {
  @ApiPropertyOptional({
    description: '삭제 일시',
    example: '2024-01-15T11:00:00Z',
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  updatedBy?: string;

  @ApiProperty({
    description: '매핑 일시',
    example: '2024-01-15T09:00:00Z',
  })
  mappedDate: Date;

  @ApiProperty({
    description: '매핑자 ID',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  mappedBy: string;

  @ApiProperty({
    description: '활성 상태',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: '평가자 정보',
    type: EmployeeInfoDto,
  })
  evaluator?: EmployeeInfoDto | null;

  @ApiPropertyOptional({
    description: '평가자 부서 정보',
    type: DepartmentInfoDto,
  })
  evaluatorDepartment?: DepartmentInfoDto | null;

  @ApiPropertyOptional({
    description: '피평가자 정보',
    type: EmployeeInfoDto,
  })
  evaluatee?: EmployeeInfoDto | null;

  @ApiPropertyOptional({
    description: '피평가자 부서 정보',
    type: DepartmentInfoDto,
  })
  evaluateeDepartment?: DepartmentInfoDto | null;
}
