import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliverableMapping } from './deliverable-mapping.entity';
import { DeliverableMappingService } from './deliverable-mapping.service';

/**
 * 산출물 매핑 모듈
 * 산출물 매핑 관련 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DeliverableMapping])],
  providers: [DeliverableMappingService],
  exports: [DeliverableMappingService],
})
export class DeliverableMappingModule {}
