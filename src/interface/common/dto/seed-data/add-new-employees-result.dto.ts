import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 신규 입사자 추가 결과 DTO
 */
export class AddNewEmployeesResultDto {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '메시지',
    example: '신규 입사자 3명이 성공적으로 추가되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '추가된 직원 수',
    example: 3,
  })
  addedCount: number;

  @ApiProperty({
    description: '실패한 직원 수',
    example: 0,
  })
  failedCount: number;

  @ApiProperty({
    description:
      '배치 번호 (되돌리기 시 사용, 직원 번호의 접두사 부분)',
    example: 'NEW1732512345',
  })
  batchNumber: string;

  @ApiPropertyOptional({
    description: '오류 목록 (실패한 경우)',
    type: [String],
    example: [],
  })
  errors?: string[];

  @ApiProperty({
    description: '추가된 직원 ID 목록',
    type: [String],
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
  })
  addedEmployeeIds: string[];
}

