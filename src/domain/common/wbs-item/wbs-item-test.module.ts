import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WbsItem } from './wbs-item.entity';
import { WbsItemTestService } from './wbs-item-test.service';

/**
 * WBS 항목 테스트용 모듈
 *
 * 테스트 시 사용할 목데이터 생성 및 관리 기능을 제공합니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([WbsItem])],
  providers: [WbsItemTestService],
  exports: [WbsItemTestService],
})
export class WbsItemTestModule {}
