import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  RegisterEvaluationTargetHandler,
  RegisterEvaluationTargetCommand,
} from './register-evaluation-target.handler';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';

describe('RegisterEvaluationTargetHandler', () => {
  let handler: RegisterEvaluationTargetHandler;
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let mappingService: EvaluationPeriodEmployeeMappingService;

  const mockEvaluationPeriod = {
    id: 'period-1',
    name: '테스트 평가기간',
  } as EvaluationPeriod;

  const mockActiveEmployee = {
    id: 'employee-1',
    name: '재직중 직원',
    status: '재직중',
    isExcludedFromList: false,
  } as Employee;

  const mockResignedEmployee = {
    id: 'employee-2',
    name: '퇴사 직원',
    status: '퇴사',
    isExcludedFromList: false,
  } as Employee;

  const mockOnLeaveEmployee = {
    id: 'employee-3',
    name: '휴직 직원',
    status: '휴직중',
    isExcludedFromList: false,
  } as Employee;

  const mockExcludedEmployee = {
    id: 'employee-4',
    name: '조회 제외 직원',
    status: '재직중',
    isExcludedFromList: true,
  } as Employee;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterEvaluationTargetHandler,
        {
          provide: getRepositoryToken(EvaluationPeriod),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: EvaluationPeriodEmployeeMappingService,
          useValue: {
            평가대상자를_등록한다: jest.fn(),
            평가대상에서_제외한다: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<RegisterEvaluationTargetHandler>(
      RegisterEvaluationTargetHandler,
    );
    evaluationPeriodRepository = module.get(
      getRepositoryToken(EvaluationPeriod),
    );
    employeeRepository = module.get(getRepositoryToken(Employee));
    mappingService = module.get(EvaluationPeriodEmployeeMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('평가 대상자 등록', () => {
    it('재직중 직원을 평가 대상자로 등록할 수 있어야 함', async () => {
      // Given
      const command = new RegisterEvaluationTargetCommand(
        'period-1',
        'employee-1',
        'admin',
      );

      jest
        .spyOn(evaluationPeriodRepository, 'findOne')
        .mockResolvedValue(mockEvaluationPeriod);
      jest
        .spyOn(employeeRepository, 'findOne')
        .mockResolvedValue(mockActiveEmployee);
      jest
        .spyOn(mappingService, '평가대상자를_등록한다')
        .mockResolvedValue({
          id: 'mapping-1',
          evaluationPeriodId: 'period-1',
          employeeId: 'employee-1',
          isExcluded: false,
        } as any);

      // When
      const result = await handler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.isExcluded).toBe(false);
      expect(mappingService.평가대상자를_등록한다).toHaveBeenCalledWith({
        evaluationPeriodId: 'period-1',
        employeeId: 'employee-1',
        createdBy: 'admin',
      });
    });

    it('퇴사한 직원을 평가 대상자로 등록 시도 시 BadRequestException을 던져야 함', async () => {
      // Given
      const command = new RegisterEvaluationTargetCommand(
        'period-1',
        'employee-2',
        'admin',
      );

      jest
        .spyOn(evaluationPeriodRepository, 'findOne')
        .mockResolvedValue(mockEvaluationPeriod);
      jest
        .spyOn(employeeRepository, 'findOne')
        .mockResolvedValue(mockResignedEmployee);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        '재직중인 직원만 평가 대상자로 등록할 수 있습니다',
      );
      expect(mappingService.평가대상자를_등록한다).not.toHaveBeenCalled();
    });

    it('휴직중 직원을 평가 대상자로 등록 시도 시 BadRequestException을 던져야 함', async () => {
      // Given
      const command = new RegisterEvaluationTargetCommand(
        'period-1',
        'employee-3',
        'admin',
      );

      jest
        .spyOn(evaluationPeriodRepository, 'findOne')
        .mockResolvedValue(mockEvaluationPeriod);
      jest
        .spyOn(employeeRepository, 'findOne')
        .mockResolvedValue(mockOnLeaveEmployee);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        '재직중인 직원만 평가 대상자로 등록할 수 있습니다',
      );
      expect(mappingService.평가대상자를_등록한다).not.toHaveBeenCalled();
    });

    it('조회 제외된 재직중 직원은 등록하되 자동으로 제외 처리되어야 함', async () => {
      // Given
      const command = new RegisterEvaluationTargetCommand(
        'period-1',
        'employee-4',
        'admin',
      );

      jest
        .spyOn(evaluationPeriodRepository, 'findOne')
        .mockResolvedValue(mockEvaluationPeriod);
      jest
        .spyOn(employeeRepository, 'findOne')
        .mockResolvedValue(mockExcludedEmployee);
      jest
        .spyOn(mappingService, '평가대상자를_등록한다')
        .mockResolvedValue({
          id: 'mapping-1',
          evaluationPeriodId: 'period-1',
          employeeId: 'employee-4',
          isExcluded: false,
        } as any);
      jest
        .spyOn(mappingService, '평가대상에서_제외한다')
        .mockResolvedValue({
          id: 'mapping-1',
          evaluationPeriodId: 'period-1',
          employeeId: 'employee-4',
          isExcluded: true,
          excludeReason: '조회 제외 목록에 있는 직원',
        } as any);

      // When
      const result = await handler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.isExcluded).toBe(true);
      expect(mappingService.평가대상자를_등록한다).toHaveBeenCalled();
      expect(mappingService.평가대상에서_제외한다).toHaveBeenCalledWith(
        'period-1',
        'employee-4',
        {
          excludeReason: '조회 제외 목록에 있는 직원',
          excludedBy: 'admin',
        },
      );
    });

    it('존재하지 않는 평가기간에 대한 등록 시도 시 NotFoundException을 던져야 함', async () => {
      // Given
      const command = new RegisterEvaluationTargetCommand(
        'invalid-period',
        'employee-1',
        'admin',
      );

      jest.spyOn(evaluationPeriodRepository, 'findOne').mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        '평가기간을 찾을 수 없습니다',
      );
    });

    it('존재하지 않는 직원에 대한 등록 시도 시 NotFoundException을 던져야 함', async () => {
      // Given
      const command = new RegisterEvaluationTargetCommand(
        'period-1',
        'invalid-employee',
        'admin',
      );

      jest
        .spyOn(evaluationPeriodRepository, 'findOne')
        .mockResolvedValue(mockEvaluationPeriod);
      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        '직원을 찾을 수 없습니다',
      );
    });
  });
});

