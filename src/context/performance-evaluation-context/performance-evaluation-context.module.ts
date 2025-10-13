import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { CoreDomainModule } from '../../domain/core/core-domain.module';
import { CommonDomainModule } from '../../domain/common/common-domain.module';

// 엔티티 imports
import { WbsSelfEvaluation } from '../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { WbsSelfEvaluationMapping } from '../../domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.entity';
import { DownwardEvaluation } from '../../domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '../../domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '../../domain/core/final-evaluation/final-evaluation.entity';
import { EvaluationPeriod } from '../../domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '../../domain/common/employee/employee.entity';
import { WbsItem } from '../../domain/common/wbs-item/wbs-item.entity';

import { PerformanceEvaluationService } from './performance-evaluation.service';

// 핸들러 import
import { CommandHandlers } from './handlers/command-handlers';
import { QueryHandlers } from './handlers/query-handlers';

@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    CoreDomainModule,
    CommonDomainModule,
    TypeOrmModule.forFeature([
      WbsSelfEvaluation,
      WbsSelfEvaluationMapping,
      DownwardEvaluation,
      PeerEvaluation,
      FinalEvaluation,
      EvaluationPeriod,
      Employee,
      WbsItem,
    ]),
  ],
  providers: [
    PerformanceEvaluationService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [PerformanceEvaluationService],
})
export class PerformanceEvaluationContextModule {}
