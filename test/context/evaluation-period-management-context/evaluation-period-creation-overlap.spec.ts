import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriodOverlapException } from '@domain/core/evaluation-period/evaluation-period.exceptions';
import { CreateEvaluationPeriodMinimalDto } from '@context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import { CreateEvaluationPeriodCommandHandler, CreateEvaluationPeriodCommand } from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/create-evaluation-period.handler';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodValidationService } from '@domain/core/evaluation-period/evaluation-period-validation.service';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 평가기간 생성 컨텍스트 함수 겹침 방지 테스트
 *
 * 시작일(startDate)과 하향/동료평가 마감일(peerEvaluationDeadline)을 기준으로
 * 겹침을 방지하는지 검증합니다.
 */
describe('평가기간 생성 컨텍스트 - 겹침 방지 검증', () => {
  let handler: CreateEvaluationPeriodCommandHandler;
  let dataSource: DataSource;
  let module: TestingModule;
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  // 테스트용 기본 등급 구간
  const 기본등급구간 = [
    { grade: 'S', minRange: 95, maxRange: 100 },
    { grade: 'A', minRange: 90, maxRange: 94 },
    { grade: 'B', minRange: 80, maxRange: 89 },
    { grade: 'C', minRange: 70, maxRange: 79 },
    { grade: 'D', minRange: 0, maxRange: 69 },
  ];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CqrsModule,
        TypeOrmModule.forFeature([EvaluationPeriod, Employee]),
      ],
      providers: [
        // 서비스
        EvaluationPeriodService,
        EvaluationPeriodValidationService,
        EvaluationPeriodAutoPhaseService,
        EmployeeService,
        TransactionManagerService,
        // 핸들러
        CreateEvaluationPeriodCommandHandler,
      ],
    }).compile();

    handler = module.get<CreateEvaluationPeriodCommandHandler>(
      CreateEvaluationPeriodCommandHandler,
    );
    dataSource = module.get<DataSource>(DataSource);
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  describe('겹침 방지 검증', () => {
    it('기존 평가기간과 완전히 겹치는 기간으로 생성 시도 시 예외가 발생해야 한다', async () => {
      // 기존 평가기간 생성: 2024-01-01 ~ 2024-06-30
      const 기존평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '기존 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(기존평가기간데이터, systemAdminId),
      );

      // 완전히 겹치는 기간으로 생성 시도
      const 겹치는평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가 (중복)',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '겹치는 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await expect(
        handler.execute(
          new CreateEvaluationPeriodCommand(겹치는평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodOverlapException);
    });

    it('기존 평가기간의 시작일이 겹치는 기간으로 생성 시도 시 예외가 발생해야 한다', async () => {
      // 기존 평가기간 생성: 2024-01-01 ~ 2024-06-30
      const 기존평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '기존 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(기존평가기간데이터, systemAdminId),
      );

      // 시작일이 겹치는 기간으로 생성 시도: 2023-12-01 ~ 2024-03-31
      const 겹치는평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2023년 말 ~ 2024년 초 평가',
        startDate: new Date('2023-12-01'),
        peerEvaluationDeadline: new Date('2024-03-31'),
        description: '시작일이 겹치는 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await expect(
        handler.execute(
          new CreateEvaluationPeriodCommand(겹치는평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodOverlapException);
    });

    it('기존 평가기간의 마감일이 겹치는 기간으로 생성 시도 시 예외가 발생해야 한다', async () => {
      // 기존 평가기간 생성: 2024-01-01 ~ 2024-06-30
      const 기존평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '기존 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(기존평가기간데이터, systemAdminId),
      );

      // 마감일이 겹치는 기간으로 생성 시도: 2024-05-01 ~ 2024-08-31
      const 겹치는평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 하반기 평가',
        startDate: new Date('2024-05-01'),
        peerEvaluationDeadline: new Date('2024-08-31'),
        description: '마감일이 겹치는 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await expect(
        handler.execute(
          new CreateEvaluationPeriodCommand(겹치는평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodOverlapException);
    });

    it('기존 평가기간 내부에 포함되는 기간으로 생성 시도 시 예외가 발생해야 한다', async () => {
      // 기존 평가기간 생성: 2024-01-01 ~ 2024-06-30
      const 기존평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '기존 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(기존평가기간데이터, systemAdminId),
      );

      // 기존 평가기간 내부에 포함되는 기간으로 생성 시도: 2024-02-01 ~ 2024-05-31
      const 겹치는평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 2분기 평가',
        startDate: new Date('2024-02-01'),
        peerEvaluationDeadline: new Date('2024-05-31'),
        description: '기존 평가기간 내부에 포함되는 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await expect(
        handler.execute(
          new CreateEvaluationPeriodCommand(겹치는평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodOverlapException);
    });

    it('기존 평가기간을 완전히 포함하는 기간으로 생성 시도 시 예외가 발생해야 한다', async () => {
      // 기존 평가기간 생성: 2024-01-01 ~ 2024-06-30
      const 기존평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '기존 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(기존평가기간데이터, systemAdminId),
      );

      // 기존 평가기간을 완전히 포함하는 기간으로 생성 시도: 2023-12-01 ~ 2024-07-31
      const 겹치는평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2023년 말 ~ 2024년 중반 평가',
        startDate: new Date('2023-12-01'),
        peerEvaluationDeadline: new Date('2024-07-31'),
        description: '기존 평가기간을 포함하는 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await expect(
        handler.execute(
          new CreateEvaluationPeriodCommand(겹치는평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodOverlapException);
    });

    it('기존 평가기간 이전의 겹치지 않는 기간으로 생성 시도 시 성공해야 한다', async () => {
      // 기존 평가기간 생성: 2024-01-01 ~ 2024-06-30
      const 기존평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '기존 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(기존평가기간데이터, systemAdminId),
      );

      // 기존 평가기간 이전의 겹치지 않는 기간으로 생성 시도: 2023-01-01 ~ 2023-12-31
      const 겹치지않는평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2023년 평가',
        startDate: new Date('2023-01-01'),
        peerEvaluationDeadline: new Date('2023-12-31'),
        description: '기존 평가기간 이전의 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const result = await handler.execute(
        new CreateEvaluationPeriodCommand(겹치지않는평가기간데이터, systemAdminId),
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('2023년 평가');
      expect(result.startDate).toEqual(new Date('2023-01-01'));
      expect(result.peerEvaluationDeadline).toEqual(new Date('2023-12-31'));
    });

    it('기존 평가기간 이후의 겹치지 않는 기간으로 생성 시도 시 성공해야 한다', async () => {
      // 기존 평가기간 생성: 2024-01-01 ~ 2024-06-30
      const 기존평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '기존 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(기존평가기간데이터, systemAdminId),
      );

      // 기존 평가기간 이후의 겹치지 않는 기간으로 생성 시도: 2024-07-01 ~ 2024-12-31
      const 겹치지않는평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 하반기 평가',
        startDate: new Date('2024-07-01'),
        peerEvaluationDeadline: new Date('2024-12-31'),
        description: '기존 평가기간 이후의 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const result = await handler.execute(
        new CreateEvaluationPeriodCommand(겹치지않는평가기간데이터, systemAdminId),
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('2024년 하반기 평가');
      expect(result.startDate).toEqual(new Date('2024-07-01'));
      expect(result.peerEvaluationDeadline).toEqual(new Date('2024-12-31'));
    });

    it('기존 평가기간과 인접하지만 겹치지 않는 기간으로 생성 시도 시 성공해야 한다', async () => {
      // 기존 평가기간 생성: 2024-01-01 ~ 2024-06-30
      const 기존평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '기존 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(기존평가기간데이터, systemAdminId),
      );

      // 기존 평가기간과 인접하지만 겹치지 않는 기간으로 생성 시도: 2024-07-01 ~ 2024-12-31
      const 인접한평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 하반기 평가',
        startDate: new Date('2024-07-01'), // 기존 마감일 다음날
        peerEvaluationDeadline: new Date('2024-12-31'),
        description: '기존 평가기간과 인접한 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const result = await handler.execute(
        new CreateEvaluationPeriodCommand(인접한평가기간데이터, systemAdminId),
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('2024년 하반기 평가');
    });

    it('여러 평가기간이 있을 때 새로운 평가기간이 모든 기존 평가기간과 겹치지 않으면 성공해야 한다', async () => {
      // 첫 번째 평가기간 생성: 2024-01-01 ~ 2024-03-31
      const 첫번째평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 1분기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-03-31'),
        description: '첫 번째 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(첫번째평가기간데이터, systemAdminId),
      );

      // 두 번째 평가기간 생성: 2024-07-01 ~ 2024-09-30
      const 두번째평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 3분기 평가',
        startDate: new Date('2024-07-01'),
        peerEvaluationDeadline: new Date('2024-09-30'),
        description: '두 번째 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(두번째평가기간데이터, systemAdminId),
      );

      // 두 기존 평가기간 사이의 겹치지 않는 기간으로 생성 시도: 2024-04-01 ~ 2024-06-30
      const 중간평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 2분기 평가',
        startDate: new Date('2024-04-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '중간 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const result = await handler.execute(
        new CreateEvaluationPeriodCommand(중간평가기간데이터, systemAdminId),
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('2024년 2분기 평가');
    });

    it('여러 평가기간이 있을 때 새로운 평가기간이 하나라도 겹치면 예외가 발생해야 한다', async () => {
      // 첫 번째 평가기간 생성: 2024-01-01 ~ 2024-03-31
      const 첫번째평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 1분기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-03-31'),
        description: '첫 번째 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(첫번째평가기간데이터, systemAdminId),
      );

      // 두 번째 평가기간 생성: 2024-07-01 ~ 2024-09-30
      const 두번째평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 3분기 평가',
        startDate: new Date('2024-07-01'),
        peerEvaluationDeadline: new Date('2024-09-30'),
        description: '두 번째 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await handler.execute(
        new CreateEvaluationPeriodCommand(두번째평가기간데이터, systemAdminId),
      );

      // 첫 번째 평가기간과 겹치는 기간으로 생성 시도: 2024-02-01 ~ 2024-05-31
      const 겹치는평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 겹치는 평가',
        startDate: new Date('2024-02-01'),
        peerEvaluationDeadline: new Date('2024-05-31'),
        description: '첫 번째 평가기간과 겹치는 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      await expect(
        handler.execute(
          new CreateEvaluationPeriodCommand(겹치는평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodOverlapException);
    });
  });
});

