import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 재작성 완료 응답 DTO
 */
export class CompleteRevisionRequestDto {
  @ApiProperty({
    description: '재작성 완료 응답 코멘트',
    example: '평가기준을 수정 완료했습니다.',
  })
  @IsString()
  @IsNotEmpty()
  responseComment: string;
}

