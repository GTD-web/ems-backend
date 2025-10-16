import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionGroupMapping } from './question-group-mapping.entity';
import { QuestionGroupMappingService } from './question-group-mapping.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionGroupMapping])],
  providers: [QuestionGroupMappingService],
  exports: [TypeOrmModule, QuestionGroupMappingService],
})
export class QuestionGroupMappingModule {}
