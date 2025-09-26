import { Module } from '@nestjs/common';
import { CommonDomainModule } from './domain/common/common-domain.module';
import { CoreDomainModule } from './domain/core/core-domain.module';
import { SubDomainModule } from './domain/sub/sub-domain.module';

@Module({
  imports: [CommonDomainModule, CoreDomainModule, SubDomainModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
