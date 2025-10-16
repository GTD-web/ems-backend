import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeerEvaluationQuestionMapping } from './peer-evaluation-question-mapping.entity';
import { PeerEvaluationQuestionMappingService } from './peer-evaluation-question-mapping.service';

@Module({
  imports: [TypeOrmModule.forFeature([PeerEvaluationQuestionMapping])],
  providers: [PeerEvaluationQuestionMappingService],
  exports: [TypeOrmModule, PeerEvaluationQuestionMappingService],
})
export class PeerEvaluationQuestionMappingModule {}

