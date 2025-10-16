import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionGroupMapping } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.entity';

/**
 * 질문 순서를 위로 이동하는 커맨드
 */
export class MoveQuestionUpCommand {
  constructor(
    public readonly mappingId: string,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 질문 순서를 위로 이동하는 핸들러
 *
 * 현재 질문의 displayOrder와 바로 위 질문의 displayOrder를 swap합니다.
 */
@Injectable()
@CommandHandler(MoveQuestionUpCommand)
export class MoveQuestionUpHandler
  implements ICommandHandler<MoveQuestionUpCommand, void>
{
  private readonly logger = new Logger(MoveQuestionUpHandler.name);

  constructor(
    @InjectRepository(QuestionGroupMapping)
    private readonly questionGroupMappingRepository: Repository<QuestionGroupMapping>,
  ) {}

  async execute(command: MoveQuestionUpCommand): Promise<void> {
    this.logger.log('질문 순서 위로 이동 시작', command);

    const { mappingId, updatedBy } = command;

    // 현재 매핑 조회
    const currentMapping = await this.questionGroupMappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.id = :mappingId', { mappingId })
      .andWhere('mapping.deletedAt IS NULL')
      .getOne();

    if (!currentMapping) {
      throw new NotFoundException(
        `질문-그룹 매핑을 찾을 수 없습니다. (id: ${mappingId})`,
      );
    }

    // 바로 위 순서의 매핑 조회 (현재보다 displayOrder가 작은 것 중 가장 큰 값)
    const previousMapping = await this.questionGroupMappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.groupId = :groupId', { groupId: currentMapping.groupId })
      .andWhere('mapping.displayOrder < :currentOrder', {
        currentOrder: currentMapping.displayOrder,
      })
      .andWhere('mapping.deletedAt IS NULL')
      .orderBy('mapping.displayOrder', 'DESC')
      .getOne();

    if (!previousMapping) {
      throw new BadRequestException('이미 첫 번째 위치입니다.');
    }

    // displayOrder swap
    const currentOrder = currentMapping.displayOrder;
    const previousOrder = previousMapping.displayOrder;

    currentMapping.표시순서변경한다(previousOrder, updatedBy);
    previousMapping.표시순서변경한다(currentOrder, updatedBy);

    await this.questionGroupMappingRepository.save([
      currentMapping,
      previousMapping,
    ]);

    this.logger.log(
      `질문 순서 위로 이동 완료 - 매핑 ID: ${mappingId}, ${currentOrder} -> ${previousOrder}`,
    );
  }
}
