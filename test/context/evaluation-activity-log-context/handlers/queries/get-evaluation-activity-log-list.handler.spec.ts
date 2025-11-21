import { Test, TestingModule } from '@nestjs/testing';
import {
  GetEvaluationActivityLogListHandler,
  평가활동내역목록을조회한다,
} from '@context/evaluation-activity-log-context/handlers/queries/get-evaluation-activity-log-list.handler';
import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';

describe('GetEvaluationActivityLogListHandler', () => {
  let handler: GetEvaluationActivityLogListHandler;
  let activityLogService: jest.Mocked<EvaluationActivityLogService>;

  const mockActivityLogService = {
    평가기간_피평가자_활동내역을_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEvaluationActivityLogListHandler,
        {
          provide: EvaluationActivityLogService,
          useValue: mockActivityLogService,
        },
      ],
    }).compile();

    handler = module.get<GetEvaluationActivityLogListHandler>(
      GetEvaluationActivityLogListHandler,
    );
    activityLogService = module.get(EvaluationActivityLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('전체 활동 내역 목록을 조회한다', async () => {
      // Arrange
      const query = new 평가활동내역목록을조회한다(
        'period-1',
        'employee-1',
        undefined,
        undefined,
        undefined,
        1,
        20,
      );

      const mockResult = {
        logs: [
          {
            id: 'log-1',
            periodId: 'period-1',
            employeeId: 'employee-1',
            activityType: 'wbs_assignment',
            activityAction: 'created',
            activityTitle: 'WBS 할당',
            activityDescription: '홍길동님이 WBS 할당을 생성했습니다.',
            createdAt: new Date(),
          },
          {
            id: 'log-2',
            periodId: 'period-1',
            employeeId: 'employee-1',
            activityType: 'evaluation_criteria',
            activityAction: 'submitted',
            activityTitle: '평가기준 제출',
            activityDescription: '홍길동님이 평가기준 제출을 제출했습니다.',
            createdAt: new Date(),
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockActivityLogService.평가기간_피평가자_활동내역을_조회한다.mockResolvedValue(
        mockResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(mockResult);
      expect(
        activityLogService.평가기간_피평가자_활동내역을_조회한다,
      ).toHaveBeenCalledWith({
        periodId: 'period-1',
        employeeId: 'employee-1',
        activityType: undefined,
        startDate: undefined,
        endDate: undefined,
        page: 1,
        limit: 20,
      });
    });

    it('활동 유형으로 필터링하여 조회한다', async () => {
      // Arrange
      const query = new 평가활동내역목록을조회한다(
        'period-1',
        'employee-1',
        'wbs_assignment',
        undefined,
        undefined,
        1,
        20,
      );

      const mockResult = {
        logs: [
          {
            id: 'log-1',
            activityType: 'wbs_assignment',
            activityAction: 'created',
            activityTitle: 'WBS 할당',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockActivityLogService.평가기간_피평가자_활동내역을_조회한다.mockResolvedValue(
        mockResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].activityType).toBe('wbs_assignment');
      expect(
        activityLogService.평가기간_피평가자_활동내역을_조회한다,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: 'wbs_assignment',
        }),
      );
    });

    it('기간으로 필터링하여 조회한다', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const query = new 평가활동내역목록을조회한다(
        'period-1',
        'employee-1',
        undefined,
        startDate,
        endDate,
        1,
        20,
      );

      const mockResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockActivityLogService.평가기간_피평가자_활동내역을_조회한다.mockResolvedValue(
        mockResult,
      );

      // Act
      await handler.execute(query);

      // Assert
      expect(
        activityLogService.평가기간_피평가자_활동내역을_조회한다,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        }),
      );
    });

    it('페이징으로 활동 내역 목록을 조회한다', async () => {
      // Arrange
      const query = new 평가활동내역목록을조회한다(
        'period-1',
        'employee-1',
        undefined,
        undefined,
        undefined,
        2,
        10,
      );

      const mockResult = {
        logs: Array.from({ length: 10 }, (_, i) => ({
          id: `log-${i + 11}`,
          activityTitle: `활동 ${i + 11}`,
        })),
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      };

      mockActivityLogService.평가기간_피평가자_활동내역을_조회한다.mockResolvedValue(
        mockResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.logs).toHaveLength(10);
    });

    it('기본 페이지 및 리밋 값을 사용한다', async () => {
      // Arrange
      const query = new 평가활동내역목록을조회한다(
        'period-1',
        'employee-1',
      );

      const mockResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockActivityLogService.평가기간_피평가자_활동내역을_조회한다.mockResolvedValue(
        mockResult,
      );

      // Act
      await handler.execute(query);

      // Assert
      expect(
        activityLogService.평가기간_피평가자_활동내역을_조회한다,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
        }),
      );
    });

    it('여러 필터를 동시에 적용하여 조회한다', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const query = new 평가활동내역목록을조회한다(
        'period-1',
        'employee-1',
        'step_approval',
        startDate,
        endDate,
        1,
        15,
      );

      const mockResult = {
        logs: [
          {
            id: 'log-1',
            activityType: 'step_approval',
            activityAction: 'approved',
          },
        ],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };

      mockActivityLogService.평가기간_피평가자_활동내역을_조회한다.mockResolvedValue(
        mockResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(
        activityLogService.평가기간_피평가자_활동내역을_조회한다,
      ).toHaveBeenCalledWith({
        periodId: 'period-1',
        employeeId: 'employee-1',
        activityType: 'step_approval',
        startDate,
        endDate,
        page: 1,
        limit: 15,
      });
      expect(result.logs[0].activityType).toBe('step_approval');
    });
  });
});

