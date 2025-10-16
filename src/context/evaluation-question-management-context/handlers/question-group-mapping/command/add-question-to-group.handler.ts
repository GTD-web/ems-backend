import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import { QuestionGroupMapping } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.entity';
import type { CreateQuestionGroupMappingDto } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.types';

/**
 * 그룹에 질문 추가 커맨드
 */
export class AddQuestionToGroupCommand {
  constructor(
    public readonly data: CreateQuestionGroupMappingDto,
    public readonly createdBy: string,
  ) {}
}

/**
 * 그룹에 질문 추가 핸들러
 *
 * displayOrder가 제공되지 않으면 자동으로 그룹의 마지막 순서로 배치됩니다.
 */
@Injectable()
@CommandHandler(AddQuestionToGroupCommand)
export class AddQuestionToGroupHandler
  implements ICommandHandler<AddQuestionToGroupCommand, string>
{
  private readonly logger = new Logger(AddQuestionToGroupHandler.name);

  constructor(
    private readonly questionGroupMappingService: QuestionGroupMappingService,
    @InjectRepository(QuestionGroupMapping)
    private readonly questionGroupMappingRepository: Repository<QuestionGroupMapping>,
  ) {}

  async execute(command: AddQuestionToGroupCommand): Promise<string> {
    this.logger.log('그룹에 질문 추가 시작', command);

    const { data, createdBy } = command;

    // displayOrder가 제공되지 않은 경우, 그룹의 마지막 순서로 자동 설정
    let displayOrder = data.displayOrder ?? 0;

    if (data.displayOrder === undefined || data.displayOrder === null) {
      // 그룹의 현재 최대 displayOrder 조회
      const maxOrderMapping = await this.questionGroupMappingRepository
        .createQueryBuilder('mapping')
        .where('mapping.groupId = :groupId', { groupId: data.groupId })
        .andWhere('mapping.deletedAt IS NULL')
        .orderBy('mapping.displayOrder', 'DESC')
        .getOne();

      // 마지막 순서 다음으로 설정 (없으면 0)
      displayOrder = maxOrderMapping ? maxOrderMapping.displayOrder + 1 : 0;

      this.logger.log(
        `displayOrder 자동 설정 - 그룹 ID: ${data.groupId}, 순서: ${displayOrder}`,
      );
    }

    const mapping = await this.questionGroupMappingService.생성한다(
      {
        ...data,
        displayOrder,
      },
      createdBy,
    );

    this.logger.log(
      `그룹에 질문 추가 완료 - 매핑 ID: ${mapping.id}, 그룹: ${data.groupId}, 질문: ${data.questionId}, 순서: ${displayOrder}`,
    );
    return mapping.id;
  }
}
