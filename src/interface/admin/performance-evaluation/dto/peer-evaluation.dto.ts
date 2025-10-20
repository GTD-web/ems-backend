import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  ArrayNotEmpty,
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
    description: '요청 마감일 (ISO 8601 형식)',
    example: '2024-12-31T23:59:59Z',
    type: String,
  })
  @IsOptional()
  @Type(() => Date)
  requestDeadline?: Date;

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

  // Swagger에 표시하지 않기 위해 @Api 데코레이터 제거
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
  @ArrayNotEmpty()
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
    description: '요청 마감일 (ISO 8601 형식)',
    example: '2024-12-31T23:59:59Z',
    type: String,
  })
  @IsOptional()
  @Type(() => Date)
  requestDeadline?: Date;

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

  // Swagger에 표시하지 않기 위해 @Api 데코레이터 제거
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
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  evaluateeIds: string[];

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID()
  periodId: string;

  @ApiPropertyOptional({
    description: '요청 마감일 (ISO 8601 형식)',
    example: '2024-12-31T23:59:59Z',
    type: String,
  })
  @IsOptional()
  @Type(() => Date)
  requestDeadline?: Date;

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

  // Swagger에 표시하지 않기 위해 @Api 데코레이터 제거
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

  // Swagger에 표시하지 않기 위해 @Api 데코레이터 제거
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
 *
 * Note: Body가 비어있으므로 컨트롤러에서 @Body() 사용하지 않습니다.
 * submittedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class SubmitPeerEvaluationDto {
  // 이 DTO는 더 이상 필드가 없습니다.
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
 * 개별 동료평가 요청 결과 DTO
 */
export class PeerEvaluationRequestResult {
  @ApiPropertyOptional({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  evaluatorId?: string;

  @ApiPropertyOptional({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluateeId?: string;

  @ApiProperty({
    description: '요청 성공 여부',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: '생성된 동료평가 ID (성공 시)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  evaluationId?: string;

  @ApiPropertyOptional({
    description: '에러 정보 (실패 시)',
    example: {
      code: 'RESOURCE_NOT_FOUND',
      message: '평가자를 찾을 수 없습니다.',
    },
  })
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 일괄 요청 요약 정보 DTO
 */
export class BulkRequestSummary {
  @ApiProperty({
    description: '전체 요청 개수',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: '성공한 요청 개수',
    example: 3,
  })
  success: number;

  @ApiProperty({
    description: '실패한 요청 개수',
    example: 2,
  })
  failed: number;
}

/**
 * 일괄 동료평가 요청 응답 DTO
 */
export class BulkPeerEvaluationRequestResponseDto {
  @ApiProperty({
    description: '개별 요청 결과 목록',
    type: [PeerEvaluationRequestResult],
  })
  results: PeerEvaluationRequestResult[];

  @ApiProperty({
    description: '요청 처리 요약',
    type: BulkRequestSummary,
  })
  summary: BulkRequestSummary;

  @ApiProperty({
    description: '결과 메시지',
    example: '5건 중 3건의 동료평가 요청이 성공적으로 생성되었습니다.',
  })
  message: string;

  // 하위 호환성을 위한 필드 (deprecated 예정)
  @ApiPropertyOptional({
    description: '생성된 동료평가 요청 ID 목록 (deprecated: results 사용 권장)',
    type: [String],
    deprecated: true,
  })
  ids?: string[];

  @ApiPropertyOptional({
    description: '생성된 요청 개수 (deprecated: summary.success 사용 권장)',
    deprecated: true,
  })
  count?: number;
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

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  periodId: string;

  @ApiProperty({
    description: '평가일',
    example: '2024-01-15T09:00:00Z',
  })
  evaluationDate: Date;

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
    description: '평가 완료일',
    example: '2024-01-15T10:00:00Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: '요청 마감일',
    example: '2024-01-20T23:59:59Z',
  })
  requestDeadline?: Date;

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
  evaluateeId: string;

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
    description: '요청 마감일',
    example: '2024-01-20T23:59:59Z',
  })
  requestDeadline?: Date;

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
 * 상세 조회 시 평가질문 정보 DTO
 */
export class EvaluationQuestionInDetailDto {
  @ApiProperty({
    description: '질문 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({
    description: '질문 내용',
    example: '프로젝트 수행 능력은 어떠한가요?',
  })
  text: string;

  @ApiPropertyOptional({
    description: '최소 점수',
    example: 1,
  })
  minScore?: number;

  @ApiPropertyOptional({
    description: '최대 점수',
    example: 5,
  })
  maxScore?: number;

  @ApiProperty({
    description: '표시 순서',
    example: 1,
  })
  displayOrder: number;
}

/**
 * 평가기간 정보 DTO
 */
export class EvaluationPeriodInfoDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가기간명',
    example: '2024년 상반기 평가',
  })
  name: string;

  @ApiProperty({
    description: '시작일',
    example: '2024-01-01T00:00:00Z',
  })
  startDate: Date;

  @ApiProperty({
    description: '종료일',
    example: '2024-06-30T23:59:59Z',
  })
  endDate: Date;

  @ApiProperty({
    description: '상태',
    example: 'in_progress',
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
  })
  status: string;
}

/**
 * 동료평가 상세 응답 DTO
 */
export class PeerEvaluationDetailResponseDto {
  @ApiProperty({
    description: '동료평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가일',
    example: '2024-01-15T09:00:00Z',
  })
  evaluationDate: Date;

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
    description: '평가 완료일',
    example: '2024-01-15T10:00:00Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: '요청 마감일',
    example: '2024-01-20T23:59:59Z',
  })
  requestDeadline?: Date;

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
    description: '생성 일시',
    example: '2024-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '삭제 일시',
    example: '2024-01-15T11:00:00Z',
  })
  deletedAt?: Date;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: '평가기간 정보',
    type: EvaluationPeriodInfoDto,
  })
  period?: EvaluationPeriodInfoDto | null;

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

  @ApiPropertyOptional({
    description: '매핑자 정보',
    type: EmployeeInfoDto,
  })
  mappedBy?: EmployeeInfoDto | null;

  @ApiPropertyOptional({
    description: '생성자 정보',
    type: EmployeeInfoDto,
  })
  createdBy?: EmployeeInfoDto | null;

  @ApiPropertyOptional({
    description: '수정자 정보',
    type: EmployeeInfoDto,
  })
  updatedBy?: EmployeeInfoDto | null;

  @ApiProperty({
    description: '평가질문 목록',
    type: [EvaluationQuestionInDetailDto],
  })
  questions: EvaluationQuestionInDetailDto[];
}
