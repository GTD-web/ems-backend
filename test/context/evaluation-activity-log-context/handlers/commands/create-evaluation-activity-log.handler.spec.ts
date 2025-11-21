import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import {
  CreateEvaluationActivityLogHandler,
  평가활동내역을생성한다,
} from '@context/evaluation-activity-log-context/handlers/commands/create-evaluation-activity-log.handler';
import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';
import { EmployeeService } from '@domain/common/employee/employee.service';

describe('CreateEvaluationActivityLogHandler', () => {
  let handler: CreateEvaluationActivityLogHandler;
  let activityLogService: jest.Mocked<EvaluationActivityLogService>;
  let employeeService: jest.Mocked<EmployeeService>;

  const mockActivityLogService = {
    생성한다: jest.fn(),
  };

  const mockEmployeeService = {
    ID로_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEvaluationActivityLogHandler,
        {
          provide: EvaluationActivityLogService,
          useValue: mockActivityLogService,
        },
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    }).compile();

    handler = module.get<CreateEvaluationActivityLogHandler>(
      CreateEvaluationActivityLogHandler,
    );
    activityLogService = module.get(EvaluationActivityLogService);
    employeeService = module.get(EmployeeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('기본 활동 내역을 생성한다', async () => {
      // Arrange
      const command = new 평가활동내역을생성한다(
        'period-1',
        'employee-1',
        'wbs_assignment',
        'created',
        'WBS 할당',
        undefined,
        'wbs_assignment',
        'assignment-1',
        'admin-1',
        undefined,
        { wbsItemId: 'wbs-1' },
      );

      const expectedResult = {
        id: 'log-1',
        periodId: 'period-1',
        employeeId: 'employee-1',
        activityType: 'wbs_assignment',
        activityAction: 'created',
        activityTitle: 'WBS 할당',
        activityDescription: expect.any(String),
        relatedEntityType: 'wbs_assignment',
        relatedEntityId: 'assignment-1',
        performedBy: 'admin-1',
        activityMetadata: { wbsItemId: 'wbs-1' },
        activityDate: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      mockActivityLogService.생성한다.mockResolvedValue(expectedResult as any);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(activityLogService.생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          periodId: 'period-1',
          employeeId: 'employee-1',
          activityType: 'wbs_assignment',
          activityAction: 'created',
          activityTitle: 'WBS 할당',
        }),
      );
    });

    it('activityDescription이 제공되면 자동 생성하지 않는다', async () => {
      // Arrange
      const customDescription = '커스텀 설명';
      const command = new 평가활동내역을생성한다(
        'period-1',
        'employee-1',
        'wbs_assignment',
        'created',
        'WBS 할당',
        customDescription,
        'wbs_assignment',
        'assignment-1',
        'admin-1',
        undefined,
        { wbsItemId: 'wbs-1' },
      );

      const expectedResult = {
        id: 'log-1',
        activityDescription: customDescription,
      };

      mockActivityLogService.생성한다.mockResolvedValue(expectedResult as any);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(activityLogService.생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          activityDescription: customDescription,
        }),
      );
    });

    it('performedByName이 없으면 직원 정보를 조회하여 설정한다', async () => {
      // Arrange
      const command = new 평가활동내역을생성한다(
        'period-1',
        'employee-1',
        'wbs_assignment',
        'created',
        'WBS 할당',
        undefined,
        'wbs_assignment',
        'assignment-1',
        'admin-1',
        undefined, // performedByName 없음
        { wbsItemId: 'wbs-1' },
      );

      mockEmployeeService.ID로_조회한다.mockResolvedValue({
        id: 'admin-1',
        name: '홍길동',
      } as any);

      mockActivityLogService.생성한다.mockResolvedValue({ id: 'log-1' } as any);

      // Act
      await handler.execute(command);

      // Assert
      expect(employeeService.ID로_조회한다).toHaveBeenCalledWith('admin-1');
      expect(activityLogService.생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          performedByName: '홍길동',
        }),
      );
    });

    it('한글 조사(을/를)가 올바르게 생성된다 - 받침 있음', async () => {
      // Arrange
      const command = new 평가활동내역을생성한다(
        'period-1',
        'employee-1',
        'wbs_assignment',
        'created',
        'WBS 할당', // '할당'은 받침 있음
        undefined,
        'wbs_assignment',
        'assignment-1',
        'admin-1',
        '홍길동',
        { wbsItemId: 'wbs-1' },
      );

      mockActivityLogService.생성한다.mockResolvedValue({ id: 'log-1' } as any);

      // Act
      await handler.execute(command);

      // Assert
      expect(activityLogService.생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          activityDescription: expect.stringContaining('을'), // 받침 있음 -> '을'
        }),
      );
    });

    it('한글 조사(을/를)가 올바르게 생성된다 - 받침 없음', async () => {
      // Arrange
      const command = new 평가활동내역을생성한다(
        'period-1',
        'employee-1',
        'evaluation_criteria',
        'updated',
        '평가 수정', // '평가'는 받침 없음
        undefined,
        'evaluation_criteria',
        'criteria-1',
        'admin-1',
        '홍길동',
        undefined,
      );

      mockActivityLogService.생성한다.mockResolvedValue({ id: 'log-1' } as any);

      // Act
      await handler.execute(command);

      // Assert
      expect(activityLogService.생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          activityDescription: expect.stringContaining('를'), // 받침 없음 -> '를'
        }),
      );
    });

    it('직원 조회 실패 시에도 활동 내역을 생성한다', async () => {
      // Arrange
      const command = new 평가활동내역을생성한다(
        'period-1',
        'employee-1',
        'wbs_assignment',
        'created',
        'WBS 할당',
        undefined,
        'wbs_assignment',
        'assignment-1',
        'admin-1',
        undefined,
        { wbsItemId: 'wbs-1' },
      );

      mockEmployeeService.ID로_조회한다.mockRejectedValue(
        new Error('직원을 찾을 수 없습니다'),
      );
      mockActivityLogService.생성한다.mockResolvedValue({ id: 'log-1' } as any);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(activityLogService.생성한다).toHaveBeenCalled();
    });
  });
});

