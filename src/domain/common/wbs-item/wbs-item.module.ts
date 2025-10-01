import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WbsItem } from './wbs-item.entity';
import { WbsItemService } from './wbs-item.service';
import { WbsItemTestService } from './wbs-item-test.service';

/**
 * WBS 항목 모듈 (평가 시스템 전용)
 *
 * 평가 시스템에서 사용하는 WBS 항목 관련 엔티티, 리포지토리를 제공합니다.
 * 외부 시스템 연동 없이 독립적으로 운영됩니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([WbsItem])],
  providers: [WbsItemService, WbsItemTestService],
  exports: [WbsItemService, WbsItemTestService, TypeOrmModule],
})
export class WbsItemModule {}
