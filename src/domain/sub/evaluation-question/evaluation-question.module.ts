import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationQuestion } from './evaluation-question.entity';
import { EvaluationQuestionService } from './evaluation-question.service';

@Module({
  imports: [TypeOrmModule.forFeature([EvaluationQuestion])],
  providers: [EvaluationQuestionService],
  exports: [TypeOrmModule, EvaluationQuestionService],
})
export class EvaluationQuestionModule {}
