import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationRevisionRequest } from './evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from './evaluation-revision-request-recipient.entity';
import { EvaluationRevisionRequestService } from './evaluation-revision-request.service';

/**
 * 재작성 요청 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EvaluationRevisionRequest,
      EvaluationRevisionRequestRecipient,
    ]),
  ],
  providers: [EvaluationRevisionRequestService],
  exports: [EvaluationRevisionRequestService],
})
export class EvaluationRevisionRequestModule {}



