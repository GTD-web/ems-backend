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
 * 질문 순서를 아래로 이동하는 커맨드
 */
export class MoveQuestionDownCommand {
  constructor(
    public readonly mappingId: string,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 질문 순서를 아래로 이동하는 핸들러
 *
 * 현재 질문의 displayOrder와 바로 아래 질문의 displayOrder를 swap합니다.
 */
@Injectable()
@CommandHandler(MoveQuestionDownCommand)
export class MoveQuestionDownHandler
  implements ICommandHandler<MoveQuestionDownCommand, void>
{
  private readonly logger = new Logger(MoveQuestionDownHandler.name);

  constructor(
    @InjectRepository(QuestionGroupMapping)
    private readonly questionGroupMappingRepository: Repository<QuestionGroupMapping>,
  ) {}

  async execute(command: MoveQuestionDownCommand): Promise<void> {
    this.logger.log('질문 순서 아래로 이동 시작', command);

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

    // 바로 아래 순서의 매핑 조회 (현재보다 displayOrder가 큰 것 중 가장 작은 값)
    const nextMapping = await this.questionGroupMappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.groupId = :groupId', { groupId: currentMapping.groupId })
      .andWhere('mapping.displayOrder > :currentOrder', {
        currentOrder: currentMapping.displayOrder,
      })
      .andWhere('mapping.deletedAt IS NULL')
      .orderBy('mapping.displayOrder', 'ASC')
      .getOne();

    if (!nextMapping) {
      throw new BadRequestException('이미 마지막 위치입니다.');
    }

    // displayOrder swap
    const currentOrder = currentMapping.displayOrder;
    const nextOrder = nextMapping.displayOrder;

    currentMapping.표시순서변경한다(nextOrder, updatedBy);
    nextMapping.표시순서변경한다(currentOrder, updatedBy);

    await this.questionGroupMappingRepository.save([
      currentMapping,
      nextMapping,
    ]);

    this.logger.log(
      `질문 순서 아래로 이동 완료 - 매핑 ID: ${mappingId}, ${currentOrder} -> ${nextOrder}`,
    );
  }
}
