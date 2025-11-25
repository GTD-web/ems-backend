import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

/**
 * 신규 입사자 추가 요청 DTO
 */
export class AddNewEmployeesDto {
  @ApiProperty({
    description: '추가할 신규 입사자 수',
    example: 5,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1, { message: '최소 1명 이상 입력해야 합니다.' })
  @Max(100, { message: '최대 100명까지 한 번에 추가할 수 있습니다.' })
  count: number;
}

