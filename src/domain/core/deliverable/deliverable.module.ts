import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deliverable } from './deliverable.entity';
import { DeliverableService } from './deliverable.service';

/**
 * 산출물 모듈
 * 산출물 관련 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Deliverable])],
  providers: [DeliverableService],
  exports: [DeliverableService],
})
export class DeliverableModule {}
