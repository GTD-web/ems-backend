import { DatabaseModule } from '@libs/database/database.module';
import { Module } from '@nestjs/common';
import { CommonDomainModule } from './domain/common/common-domain.module';
import { CoreDomainModule } from './domain/core/core-domain.module';
import { SubDomainModule } from './domain/sub/sub-domain.module';
import { DomainContextModule } from './context/domain-context.module';
import { InterfaceModule } from './interface/interface.module';

@Module({
  imports: [
    DatabaseModule,
    CommonDomainModule,
    CoreDomainModule,
    SubDomainModule,
    DomainContextModule,
    InterfaceModule, // API 인터페이스 모듈 추가
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
