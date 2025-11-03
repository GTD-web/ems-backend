import { Module } from '@nestjs/common';
import { RevisionRequestController } from './revision-request.controller';
import { RevisionRequestContextModule } from '@context/revision-request-context';

/**
 * 재작성 요청 모듈
 */
@Module({
  imports: [RevisionRequestContextModule],
  controllers: [RevisionRequestController],
})
export class RevisionRequestModule {}

