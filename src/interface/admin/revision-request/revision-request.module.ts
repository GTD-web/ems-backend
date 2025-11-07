import { Module } from '@nestjs/common';
import { RevisionRequestController } from './revision-request.controller';
import { RevisionRequestContextModule } from '@context/revision-request-context';
import { RevisionRequestBusinessModule } from '@business/revision-request/revision-request-business.module';

/**
 * 재작성 요청 모듈
 */
@Module({
  imports: [
    RevisionRequestContextModule,
    RevisionRequestBusinessModule,
  ],
  controllers: [RevisionRequestController],
})
export class RevisionRequestModule {}



