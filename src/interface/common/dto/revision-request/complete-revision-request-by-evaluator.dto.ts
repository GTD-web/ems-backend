import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 평가기간, 직원, 평가자 기반 재작성 완료 응답 DTO (관리자용)
 * 
 * evaluationPeriodId, employeeId, evaluatorId, step은 쿼리 파라미터로 전달됩니다.
 * Body에는 responseComment만 포함됩니다.
 */
export class CompleteRevisionRequestByEvaluatorDto {
  @ApiProperty({
    description: '재작성 완료 응답 코멘트',
    example: '평가기준을 수정 완료했습니다.',
  })
  @IsString()
  @IsNotEmpty()
  responseComment: string;
}

