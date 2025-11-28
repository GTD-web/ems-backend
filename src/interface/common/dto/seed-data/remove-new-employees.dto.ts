import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * 신규 입사자 삭제 요청 DTO
 */
export class RemoveNewEmployeesDto {
  @ApiProperty({
    description:
      '삭제할 직원 배치 번호 (직원 추가 시 생성된 타임스탬프, 예: NEW1234567890)',
    example: 'NEW1732512345',
    pattern: '^NEW[0-9]{10,13}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^NEW[0-9]{10,13}$/, {
    message:
      '배치 번호는 NEW로 시작하고 10-13자리 숫자가 따라와야 합니다. (예: NEW1234567890)',
  })
  batchNumber: string;
}

