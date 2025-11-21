import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import {
  CreateRevisionCompletedActivityLogHandler,
  재작성완료활동내역을생성한다,
} from '@context/evaluation-activity-log-context/handlers/commands/create-revision-completed-activity-log.handler';
import type { RevisionRequestStepType } from '@domain/sub/evaluation-revision-request';

describe('CreateRevisionCompletedActivityLogHandler', () => {
  let handler: CreateRevisionCompletedActivityLogHandler;
  let commandBus: jest.Mocked<CommandBus>;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRevisionCompletedActivityLogHandler,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    }).compile();

    handler = module.get<CreateRevisionCompletedActivityLogHandler>(
      CreateRevisionCompletedActivityLogHandler,
    );
    commandBus = module.get(CommandBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('평가기준 설정 재작성 완료 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 재작성완료활동내역을생성한다(
        'period-1',
        'employee-1',
        'criteria' as RevisionRequestStepType,
        'request-1',
        'employee-1',
        '재작성을 완료했습니다',
        true,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          periodId: 'period-1',
          employeeId: 'employee-1',
          activityType: 'revision_request',
          activityAction: 'revision_completed',
          activityTitle: '평가기준 설정 재작성 완료',
          relatedEntityType: 'revision_request',
          relatedEntityId: 'request-1',
          performedBy: 'employee-1',
          activityMetadata: expect.objectContaining({
            step: 'criteria',
            responseComment: '재작성을 완료했습니다',
            allCompleted: true,
          }),
        }),
      );
    });

    it('자기평가 재작성 완료 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 재작성완료활동내역을생성한다(
        'period-1',
        'employee-1',
        'self' as RevisionRequestStepType,
        'request-1',
        'employee-1',
        '자기평가를 수정했습니다',
        false,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      await handler.execute(command);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          activityTitle: '자기평가 재작성 완료',
          activityMetadata: expect.objectContaining({
            step: 'self',
            allCompleted: false,
          }),
        }),
      );
    });

    it('1차 하향평가 재작성 완료 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 재작성완료활동내역을생성한다(
        'period-1',
        'employee-1',
        'primary' as RevisionRequestStepType,
        'request-1',
        'evaluator-1',
        '1차 평가를 재작성했습니다',
        true,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      await handler.execute(command);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          activityTitle: '1차 하향평가 재작성 완료',
        }),
      );
    });

    it('2차 하향평가 재작성 완료 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 재작성완료활동내역을생성한다(
        'period-1',
        'employee-1',
        'secondary' as RevisionRequestStepType,
        'request-1',
        'evaluator-2',
        '2차 평가를 재작성했습니다',
        true,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      await handler.execute(command);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          activityTitle: '2차 하향평가 재작성 완료',
        }),
      );
    });

    it('responseComment를 포함한 메타데이터가 올바르게 전달된다', async () => {
      // Arrange
      const responseComment = '상세한 수정 내용입니다';
      const command = new 재작성완료활동내역을생성한다(
        'period-1',
        'employee-1',
        'self' as RevisionRequestStepType,
        'request-1',
        'employee-1',
        responseComment,
        true,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      await handler.execute(command);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          activityMetadata: expect.objectContaining({
            responseComment,
          }),
        }),
      );
    });
  });
});

