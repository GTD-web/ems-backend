import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationResponse } from './evaluation-response.entity';
import { EvaluationResponseService } from './evaluation-response.service';

@Module({
  imports: [TypeOrmModule.forFeature([EvaluationResponse])],
  providers: [EvaluationResponseService],
  exports: [TypeOrmModule, EvaluationResponseService],
})
export class EvaluationResponseModule {}
