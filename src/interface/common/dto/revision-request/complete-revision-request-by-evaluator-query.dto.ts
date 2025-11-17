import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RevisionRequestStepEnum } from './get-revision-requests-query.dto';

/**
 * 평가기간, 직원, 평가자 기반 재작성 완료 응답 쿼리 DTO (관리자용)
 */
export class CompleteRevisionRequestByEvaluatorQueryDto {
  @ApiProperty({
    description: '재작성 요청 단계',
    enum: RevisionRequestStepEnum,
    example: RevisionRequestStepEnum.SECONDARY,
  })
  @IsEnum(RevisionRequestStepEnum)
  @IsNotEmpty()
  step: RevisionRequestStepEnum;
}
