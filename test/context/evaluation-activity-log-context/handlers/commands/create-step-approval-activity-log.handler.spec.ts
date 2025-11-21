import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import {
  CreateStepApprovalActivityLogHandler,
  단계승인활동내역을생성한다,
} from '@context/evaluation-activity-log-context/handlers/commands/create-step-approval-activity-log.handler';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';

describe('CreateStepApprovalActivityLogHandler', () => {
  let handler: CreateStepApprovalActivityLogHandler;
  let commandBus: jest.Mocked<CommandBus>;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateStepApprovalActivityLogHandler,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    }).compile();

    handler = module.get<CreateStepApprovalActivityLogHandler>(
      CreateStepApprovalActivityLogHandler,
    );
    commandBus = module.get(CommandBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('평가기준 설정 승인 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 단계승인활동내역을생성한다(
        'period-1',
        'employee-1',
        'criteria',
        StepApprovalStatus.APPROVED,
        'evaluator-1',
        undefined,
        undefined,
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
          activityType: 'step_approval',
          activityAction: 'approved',
          activityTitle: '평가기준 설정 승인',
        }),
      );
    });

    it('자기평가 승인 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 단계승인활동내역을생성한다(
        'period-1',
        'employee-1',
        'self',
        StepApprovalStatus.APPROVED,
        'evaluator-1',
        undefined,
        undefined,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      await handler.execute(command);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          activityTitle: '자기평가 승인',
        }),
      );
    });

    it('1차 하향평가 승인 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 단계승인활동내역을생성한다(
        'period-1',
        'employee-1',
        'primary',
        StepApprovalStatus.APPROVED,
        'evaluator-1',
        undefined,
        undefined,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      await handler.execute(command);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          activityTitle: '1차 하향평가 승인',
        }),
      );
    });

    it('2차 하향평가 승인 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 단계승인활동내역을생성한다(
        'period-1',
        'employee-1',
        'secondary',
        StepApprovalStatus.APPROVED,
        'evaluator-1',
        undefined,
        undefined,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      await handler.execute(command);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          activityTitle: '2차 하향평가 승인',
        }),
      );
    });

    it('평가기준 설정 재작성 요청 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 단계승인활동내역을생성한다(
        'period-1',
        'employee-1',
        'criteria',
        StepApprovalStatus.REVISION_REQUESTED,
        'evaluator-1',
        '재작성이 필요합니다',
        undefined,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      await handler.execute(command);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          activityAction: 'revision_requested',
          activityTitle: '평가기준 설정 재작성 요청',
          activityMetadata: expect.objectContaining({
            revisionComment: '재작성이 필요합니다',
          }),
        }),
      );
    });

    it('자기평가 재작성 요청 활동 내역을 기록한다', async () => {
      // Arrange
      const command = new 단계승인활동내역을생성한다(
        'period-1',
        'employee-1',
        'self',
        StepApprovalStatus.REVISION_REQUESTED,
        'evaluator-1',
        '수정이 필요합니다',
        undefined,
      );

      mockCommandBus.execute.mockResolvedValue({ id: 'log-1' });

      // Act
      await handler.execute(command);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          activityTitle: '자기평가 재작성 요청',
        }),
      );
    });

    it('기록하지 않는 상태로 변경 시 예외가 발생한다', async () => {
      // Arrange
      const command = new 단계승인활동내역을생성한다(
        'period-1',
        'employee-1',
        'criteria',
        StepApprovalStatus.PENDING, // APPROVED나 REVISION_REQUESTED가 아닌 상태
        'evaluator-1',
        undefined,
        undefined,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        '기록하지 않는 상태입니다',
      );
    });
  });
});

