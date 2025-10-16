import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionGroup } from './question-group.entity';
import { QuestionGroupService } from './question-group.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionGroup])],
  providers: [QuestionGroupService],
  exports: [TypeOrmModule, QuestionGroupService],
})
export class QuestionGroupModule {}
