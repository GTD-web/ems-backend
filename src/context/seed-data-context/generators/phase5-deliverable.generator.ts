import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';

import {
  SeedDataConfig,
  GeneratorResult,
  DEFAULT_STATE_DISTRIBUTION,
} from '../types';
import { ProbabilityUtil } from '../utils';

const BATCH_SIZE = 500;

@Injectable()
export class Phase5DeliverableGenerator {
  private readonly logger = new Logger(Phase5DeliverableGenerator.name);

  constructor(
    @InjectRepository(Deliverable)
    private readonly deliverableRepository: Repository<Deliverable>,
  ) {}

  async generate(
    config: SeedDataConfig,
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
  ): Promise<GeneratorResult> {
    const startTime = Date.now();
    const dist = {
      ...DEFAULT_STATE_DISTRIBUTION,
      ...config.stateDistribution,
    };

    this.logger.log('Phase 5: 산출물 생성');

    const systemAdminId = phase1Result.generatedIds.systemAdminId as string;
    const wbsIds = phase1Result.generatedIds.wbsIds as string[];
    const employeeIds = phase1Result.generatedIds.employeeIds as string[];

    // 산출물 생성 (직원 및 WBS 항목과 함께 매핑)
    const deliverables = await this.생성_산출물들(
      wbsIds,
      employeeIds,
      dist,
      systemAdminId,
    );
    this.logger.log(`생성 완료: Deliverable ${deliverables.length}개`);

    const duration = Date.now() - startTime;
    this.logger.log(`Phase 5 완료 (${duration}ms)`);

    return {
      phase: 'Phase5',
      entityCounts: {
        Deliverable: deliverables.length,
      },
      generatedIds: {
        deliverableIds: deliverables.map((d) => d.id),
      },
      duration,
    };
  }

  private async 생성_산출물들(
    wbsIds: string[],
    employeeIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<Deliverable[]> {
    const deliverables: Deliverable[] = [];

    const deliverableTypes: DeliverableType[] = [
      DeliverableType.DOCUMENT,
      DeliverableType.CODE,
      DeliverableType.DESIGN,
      DeliverableType.REPORT,
      DeliverableType.PRESENTATION,
      DeliverableType.OTHER,
    ];

    // 각 WBS 항목에 대해 산출물 생성
    for (const wbsId of wbsIds) {
      const deliverableCountChoice = ProbabilityUtil.selectByProbability(
        dist.deliverablePerWbs,
      );

      let deliverableCount = 0;
      switch (deliverableCountChoice) {
        case 'none':
          deliverableCount = 0;
          break;
        case 'one':
          deliverableCount = 1;
          break;
        case 'twoToThree':
          deliverableCount = ProbabilityUtil.randomInt(2, 3);
          break;
        case 'fourOrMore':
          deliverableCount = ProbabilityUtil.randomInt(4, 6);
          break;
      }

      // WBS 항목에 대해 산출물 생성
      for (let i = 0; i < deliverableCount; i++) {
        const randomEmployee =
          employeeIds[Math.floor(Math.random() * employeeIds.length)];

        const deliverable = new Deliverable();
        deliverable.name = faker.commerce.productName();
        deliverable.description = faker.lorem.sentence();
        deliverable.type =
          deliverableTypes[Math.floor(Math.random() * deliverableTypes.length)];

        const typeChoice = ProbabilityUtil.selectByProbability(
          dist.deliverableType,
        );
        deliverable.filePath =
          typeChoice === 'url'
            ? faker.internet.url()
            : `/nas/project/${faker.string.uuid()}/file.pdf`;

        // 매핑 정보 설정
        deliverable.employeeId = randomEmployee;
        deliverable.wbsItemId = wbsId;
        deliverable.mappedBy = systemAdminId;
        deliverable.mappedDate = new Date();
        deliverable.isActive = true;

        deliverable.createdBy = systemAdminId;
        deliverables.push(deliverable);
      }
    }

    return await this.배치로_저장한다(
      this.deliverableRepository,
      deliverables,
      '산출물',
    );
  }

  // ==================== 유틸리티 메서드 ====================

  private async 배치로_저장한다<T extends object>(
    repository: Repository<T>,
    entities: T[],
    entityName: string,
  ): Promise<T[]> {
    const saved: T[] = [];
    for (let i = 0; i < entities.length; i += BATCH_SIZE) {
      const batch = entities.slice(i, i + BATCH_SIZE);
      const result = await repository.save(batch as any);
      saved.push(...(result as T[]));
      this.logger.log(
        `${entityName} 저장 진행: ${Math.min(i + BATCH_SIZE, entities.length)}/${entities.length}`,
      );
    }
    return saved;
  }
}
